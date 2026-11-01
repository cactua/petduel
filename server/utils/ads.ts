import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import sharp from 'sharp'
import type { H3Event } from 'h3'
import { AD_IMAGE_RATIO, AD_SETTINGS_DEFAULT, adCropSchema, adSettingsSchema, type AdCrop, type AdDeal, type AdSettings } from '#shared/models'
import { centeredCrop } from '#shared/images'
import { settings, type Ad } from '../db/schema'

const TZ = 'Europe/Rome'
const MAX_AD_BYTES = 5 * 1024 * 1024

/** Il circuito Google è acceso e configurato */
export const networkReady = (n: AdSettings['network']) => n.mode !== 'off' && !!n.client && !!n.slot

export async function getAdSettings(): Promise<AdSettings> {
  const db = await useDb()
  const [row] = await db.select().from(settings).where(eq(settings.key, 'ads'))
  if (!row) return AD_SETTINGS_DEFAULT
  const saved = JSON.parse(row.value)
  const parsed = adSettingsSchema.safeParse({ ...AD_SETTINGS_DEFAULT, ...saved, network: { ...AD_SETTINGS_DEFAULT.network, ...saved.network } })
  return parsed.success ? parsed.data : AD_SETTINGS_DEFAULT
}

export async function saveAdSettings(value: AdSettings) {
  const db = await useDb()
  await db.insert(settings).values({ key: 'ads', value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
}

export const adImageUrl = (image: string | null) => (image ? `/ad-img/${image}` : null)

export function adStatus(ad: Pick<Ad, 'active' | 'startsAt' | 'endsAt'>, now = new Date()) {
  if (!ad.active) return 'paused' as const
  if (ad.startsAt && now < ad.startsAt) return 'scheduled' as const
  if (ad.endsAt && now >= ad.endsAt) return 'ended' as const
  return 'live' as const
}

/** Come adStatus, ma una campagna in onda che ha raggiunto il tetto di visualizzazioni o clic è "esaurita" */
export function adStatusWithCaps(ad: Pick<Ad, 'active' | 'startsAt' | 'endsAt'>, deal: AdDeal, views: number, clicks: number) {
  const status = adStatus(ad)
  if (status === 'live' && ((deal.maxViews && views >= deal.maxViews) || (deal.maxClicks && clicks >= deal.maxClicks))) return 'exhausted' as const
  return status
}

/** "2026-11-02" → mezzanotte ora italiana. Con endOfDay la mezzanotte del giorno dopo: la fine è esclusa */
export async function adDateToTime(date: string | null, endOfDay = false) {
  if (!date) return null
  const db = await useDb()
  const { rows: [r] } = await db.execute<{ at: Date }>(
    sql`select ((${date}::date + ${endOfDay ? 1 : 0}::int)::timestamp at time zone ${TZ}) as at`,
  )
  return new Date(r!.at)
}

/** Da data a "YYYY-MM-DD" ora italiana (per i campi del modulo); per la fine, il giorno prima */
export const adTimeToDate = (d: Date | null, endOfDay = false) =>
  d ? new Date(d.getTime() - (endOfDay ? 1 : 0)).toLocaleDateString('sv-SE', { timeZone: TZ }) : null

/**
 * Legge il modulo dell'annuncio. Se c'è un'immagine la salva come originale: ricodificata in WebP
 * (scarta EXIF e contenuti nascosti), al massimo 2000 px di lato. Il ritaglio si fa dopo, da qui.
 */
export async function readAdUpload(event: H3Event) {
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'errors.emptyForm' })
  const fields = Object.fromEntries(parts.filter(p => !p.filename).map(p => [p.name, p.data.toString('utf8')]))
  const file = parts.find(p => p.name === 'image' && p.filename)
  if (!file) return { fields, source: null }
  if (file.data.length > MAX_AD_BYTES) throw createError({ statusCode: 413, statusMessage: 'L\'immagine supera i 5 MB' })
  let buf: Buffer
  try {
    buf = await sharp(file.data, { limitInputPixels: 50_000_000, failOn: 'error' })
      .rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Il file non è un\'immagine valida' })
  }
  const source = `${randomUUID()}.webp`
  await useStorage('uploads').setItemRaw(`ads:${source}`, buf)
  return { fields, source }
}

/** Ritaglio dal campo "crop" (JSON); senza, l'immagine riempie la cornice centrata */
export function parseAdCrop(raw: string | undefined): AdCrop | null {
  if (!raw) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  }
  catch {
    value = null
  }
  const parsed = adCropSchema.safeParse(value)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'errors.invalidCrop' })
  return parsed.data
}

const OUT_W = 1080
const OUT_H = Math.round(OUT_W / AD_IMAGE_RATIO)

/**
 * Immagine finale 1080×810 dall'originale: il ritaglio può essere più grande dell'immagine
 * (rimpicciolita o spostata verso il bordo), e lì si vede il colore di sfondo.
 * Ogni versione ha un nome nuovo: le immagini restano in cache a lungo.
 */
export async function renderAdImage(source: string, crop: AdCrop | null) {
  const data = await useStorage('uploads').getItemRaw<Buffer>(`ads:${source}`)
  if (!data) throw createError({ statusCode: 400, statusMessage: 'errors.originalMissing' })
  const { width: W = 1, height: H = 1 } = await sharp(data).metadata()
  if (!crop) {
    const c = centeredCrop(W, H, AD_IMAGE_RATIO)
    crop = { ...c, bg: '#ffffff' }
  }
  // Scala dall'originale all'uscita, poi la parte dell'immagine che cade dentro la cornice
  const s = OUT_W / (crop.w * W)
  const rw = Math.max(1, Math.round(W * s))
  const rh = Math.max(1, Math.round(H * s))
  const ox = Math.round(-crop.x * W * s)
  const oy = Math.round(-crop.y * H * s)
  const left = Math.max(0, ox)
  const top = Math.max(0, oy)
  const right = Math.min(OUT_W, ox + rw)
  const bottom = Math.min(OUT_H, oy + rh)

  const layers = []
  if (right > left && bottom > top) {
    const piece = await sharp(data).resize(rw, rh, { fit: 'fill' })
      .extract({ left: left - ox, top: top - oy, width: right - left, height: bottom - top }).png().toBuffer()
    layers.push({ input: piece, left, top })
  }
  const out = await sharp({ create: { width: OUT_W, height: OUT_H, channels: 3, background: crop.bg } })
    .composite(layers).webp({ quality: 82 }).toBuffer()
  const image = `${randomUUID()}.webp`
  await useStorage('uploads').setItemRaw(`ads:${image}`, out)
  return { image, crop }
}

export async function removeAdImage(...images: (string | null)[]) {
  await Promise.all(images.filter(i => i).map(i => useStorage('uploads').removeItem(`ads:${i}`)))
}

/** Link di destinazione con i parametri UTM: l'inserzionista vede le conversioni nelle sue statistiche */
export function withUtm(url: string, ad: Pick<Ad, 'id' | 'name'>) {
  const u = new URL(url)
  const set = (k: string, v: string) => {
    if (!u.searchParams.has(k)) u.searchParams.set(k, v)
  }
  set('utm_source', 'petduel')
  set('utm_medium', 'duel_card')
  set('utm_campaign', ad.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ad-${ad.id}`)
  return u.toString()
}
