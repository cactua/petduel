import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import type { H3Event } from 'h3'
import { IMAGE_FORMATS, SHELTER_IMAGES, SHELTER_IMAGE_KINDS, shelterImageName, type ShelterImageKind } from '#shared/images'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_INPUT_PIXELS = 50_000_000

const frac = (v: string | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5
}

/**
 * Banner o logo del rifugio: la foto viene raddrizzata, ritagliata nelle proporzioni giuste attorno al
 * punto scelto (fx, fy: frazioni 0-1) e ricodificata, così sparisce ogni dato nascosto del file originale.
 */
export async function readShelterImage(event: H3Event) {
  const parts = await readMultipartFormData(event)
  const fields = Object.fromEntries((parts ?? []).filter(p => !p.filename).map(p => [p.name, p.data.toString('utf8')]))
  const kind = fields.kind as ShelterImageKind
  if (!SHELTER_IMAGE_KINDS.includes(kind)) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  const photo = parts?.find(p => p.name === 'photo' && p.filename)
  if (!photo) throw createError({ statusCode: 400, statusMessage: 'errors.photoMissing' })
  if (photo.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'errors.photoTooBig' })

  let source
  try {
    source = await sharp(photo.data, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate().raw().toBuffer({ resolveWithObject: true })
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'errors.invalidImage' })
  }
  const { width, height, channels } = source.info
  const { ratio, widths } = SHELTER_IMAGES[kind]
  // Il riquadro più grande con le proporzioni giuste, centrato il più possibile sul punto scelto
  const w = Math.min(width, Math.round(height * ratio))
  const h = Math.min(height, Math.round(w / ratio))
  const left = Math.round((width - w) * frac(fields.fx))
  const top = Math.round((height - h) * frac(fields.fy))

  const id = randomUUID()
  const uploads = useStorage('uploads')
  const jobs = widths.flatMap(target => IMAGE_FORMATS.map(async (format) => {
    const img = sharp(source.data, { raw: { width, height, channels } }).extract({ left, top, width: w, height: h })
      .resize(target, Math.round(target / ratio), { fit: 'cover', withoutEnlargement: true })
    const buf = await (format === 'avif' ? img.avif({ quality: 55, effort: 4 }) : img.webp({ quality: 80 })).toBuffer()
    await uploads.setItemRaw(shelterImageName(id, kind, target, format), buf)
  }))
  try {
    await Promise.all(jobs)
  }
  catch (e) {
    await removeShelterImage(id, kind)
    throw e
  }
  return { id, kind }
}

export async function removeShelterImage(id: string | null, kind: ShelterImageKind) {
  if (!id) return
  const uploads = useStorage('uploads')
  await Promise.all(SHELTER_IMAGES[kind].widths.flatMap(w => IMAGE_FORMATS.map(f => uploads.removeItem(shelterImageName(id, kind, w, f)))))
}
