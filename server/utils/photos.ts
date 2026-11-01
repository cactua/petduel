import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import sharp, { type OutputInfo, type Sharp } from 'sharp'
import type { H3Event } from 'h3'
import { photos, pets } from '../db/schema'
import {
  IMAGE_FORMATS, IMAGE_VARIANTS, VARIANT_KEYS, centeredCrop, cropsSchema, variantName,
  type Crop, type Crops, type ImageFormat, type ImageVariant,
} from '#shared/images'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MAX_INPUT_PIXELS = 50_000_000
// Oltre questo numero di foto in attesa non se ne accettano altre: evita di intasare la coda
export const MAX_PENDING_PER_USER = 10

// Qualità scelte per il web: AVIF è circa la metà di WebP a parità di resa, WebP resta per i browser vecchi
const encode = (img: Sharp, format: ImageFormat) =>
  format === 'avif' ? img.avif({ quality: 52, effort: 4 }) : img.webp({ quality: 78, effort: 5 })

/** Da frazioni a pixel, corretto per avere esattamente le proporzioni del ritaglio */
function cropRect(crop: Crop, width: number, height: number, ratio: number) {
  let w = Math.max(1, Math.round(crop.w * width))
  let h = Math.max(1, Math.round(crop.h * height))
  if (w / h > ratio) w = Math.max(1, Math.round(h * ratio))
  else h = Math.max(1, Math.round(w / ratio))
  const left = Math.min(Math.max(0, Math.round(crop.x * width)), width - w)
  const top = Math.min(Math.max(0, Math.round(crop.y * height)), height - h)
  return { left, top, width: w, height: h }
}

// Foto raddrizzata e decodificata una volta sola, in pixel grezzi: ogni variante parte da qui
type Source = { data: Buffer, info: OutputInfo }
const open = ({ data, info }: Source) => sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 } })

/**
 * Una variante: ritaglio + ridimensionamento. Se il ritaglio è più piccolo della larghezza richiesta
 * non si ingrandisce: il file resta alla sua misura e il browser lo scala (meglio di pixel inventati).
 */
function renderVariant(source: Source, rect: ReturnType<typeof cropRect>, variant: ImageVariant, width: number, format: ImageFormat) {
  const height = Math.round(width / IMAGE_VARIANTS[variant].ratio)
  return encode(open(source).extract(rect).resize(width, height, { fit: 'cover', withoutEnlargement: true }), format).toBuffer()
}

/** Tutte le varianti di una foto, più la foto di base (verticale 900×1200 WebP) usata come ripiego */
async function writeVariants(image: string, source: Source, crops: Crops) {
  const { width, height } = source.info
  const uploads = useStorage('uploads')
  const jobs: Promise<void>[] = []
  for (const variant of VARIANT_KEYS) {
    const rect = cropRect(crops[variant], width, height, IMAGE_VARIANTS[variant].ratio)
    for (const w of IMAGE_VARIANTS[variant].widths) {
      for (const format of IMAGE_FORMATS) {
        jobs.push(renderVariant(source, rect, variant, w, format).then(buf => uploads.setItemRaw(variantName(image, variant, w, format), buf)))
      }
    }
  }
  const baseRect = cropRect(crops.v, width, height, IMAGE_VARIANTS.v.ratio)
  jobs.push(open(source).extract(baseRect).resize(900, 1200, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    .then(buf => uploads.setItemRaw(image, buf)))
  await Promise.all(jobs)
}

/**
 * Legge un upload multipart: restituisce i campi testuali e salva la foto con i ritagli scelti
 * (campo "crops", JSON) in tutte le varianti. La ricodifica scarta qualsiasi contenuto nascosto
 * nel file originale (EXIF, GPS, payload) e rifiuta ciò che non è un'immagine. Senza ritagli
 * si usano quelli centrati.
 */
export async function readPhotoUpload(event: H3Event) {
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'errors.emptyForm' })

  const fields = Object.fromEntries(parts.filter(p => !p.filename).map(p => [p.name, p.data.toString('utf8')]))
  const photo = parts.find(p => p.name === 'photo' && p.filename)
  if (!photo) throw createError({ statusCode: 400, statusMessage: 'errors.photoMissing' })
  if (photo.data.length > MAX_PHOTO_BYTES) throw createError({ statusCode: 413, statusMessage: 'errors.photoTooBig' })

  let crops: Crops | null = null
  if (fields.crops) {
    let raw: unknown
    try {
      raw = JSON.parse(fields.crops)
    }
    catch {
      raw = null
    }
    const parsed = cropsSchema.safeParse(raw)
    if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'errors.invalidCrops' })
    crops = parsed.data
  }
  delete fields.crops

  // Foto raddrizzata secondo l'EXIF: i ritagli sono calcolati su questa
  let oriented: Source
  try {
    oriented = await sharp(photo.data, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
      .rotate().raw().toBuffer({ resolveWithObject: true })
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'errors.invalidImage' })
  }
  const { width, height } = oriented.info
  crops ??= Object.fromEntries(VARIANT_KEYS.map(v => [v, centeredCrop(width, height, IMAGE_VARIANTS[v].ratio)])) as Crops

  const image = `${randomUUID()}.webp`
  try {
    await writeVariants(image, oriented, crops)
  }
  catch (e) {
    await removeImage(image)
    throw e
  }
  return { fields, image }
}

/**
 * Variante mancante di una foto caricata prima dei ritagli (o di esempio): la ricava dalla foto
 * di base con un ritaglio automatico che cerca il soggetto, la salva e la restituisce.
 */
export async function ensureVariant(image: string, variant: ImageVariant, width: number, format: ImageFormat) {
  const uploads = useStorage('uploads')
  const name = variantName(image, variant, width, format)
  const cached = await uploads.getItemRaw(name)
  if (cached) return Buffer.from(cached)

  const base = await uploads.getItemRaw(image)
  if (!base) return null
  const height = Math.round(width / IMAGE_VARIANTS[variant].ratio)
  const buf = await encode(sharp(Buffer.from(base)).resize(width, height, { fit: 'cover', position: sharp.strategy.attention, withoutEnlargement: true }), format).toBuffer()
  await uploads.setItemRaw(name, buf)
  return buf
}

export async function assertPendingQuota(userId: number) {
  const db = await useDb()
  const [row] = await db.select({ count: sql<number>`count(*)::int` })
    .from(photos).innerJoin(pets, eq(pets.id, photos.petId))
    .where(and(eq(pets.ownerId, userId), eq(photos.status, 'pending')))
  if ((row?.count ?? 0) >= MAX_PENDING_PER_USER) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManyPending', data: { params: { n: MAX_PENDING_PER_USER } } })
  }
}

/** Cancella la foto di base e tutte le sue varianti */
export async function removeImage(image: string) {
  const uploads = useStorage('uploads')
  const names = [image]
  for (const variant of VARIANT_KEYS) {
    for (const w of IMAGE_VARIANTS[variant].widths) {
      for (const format of IMAGE_FORMATS) names.push(variantName(image, variant, w, format))
    }
  }
  await Promise.all(names.map(n => uploads.removeItem(n)))
}
