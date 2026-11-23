import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { IMAGE_FORMATS, PROFILE_IMAGES, profileImageName, type Crop, type ProfileImageKind } from '#shared/images'

/**
 * Avatar o banner: si parte dalla variante della foto già inquadrata al caricamento (quadrata o orizzontale),
 * si ritaglia la parte scelta con le proporzioni giuste e si salvano le larghezze in AVIF e WebP.
 */
export async function writeProfileImage(image: string, kind: ProfileImageKind, crop: Crop) {
  const { from, fromWidth, ratio, widths } = PROFILE_IMAGES[kind]
  const base = await ensureVariant(image, from, fromWidth, 'webp')
  if (!base) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
  const source = await sharp(base).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = source.info

  // Da frazioni a pixel, con esattamente le proporzioni giuste e dentro l'immagine
  let w = Math.max(1, Math.round(crop.w * width))
  let h = Math.max(1, Math.round(crop.h * height))
  if (w / h > ratio) w = Math.max(1, Math.round(h * ratio))
  else h = Math.max(1, Math.round(w / ratio))
  const left = Math.min(Math.max(0, Math.round(crop.x * width)), width - w)
  const top = Math.min(Math.max(0, Math.round(crop.y * height)), height - h)

  const id = randomUUID()
  const uploads = useStorage('uploads')
  const jobs = widths.flatMap(target => IMAGE_FORMATS.map(async (format) => {
    const img = sharp(source.data, { raw: { width, height, channels } }).extract({ left, top, width: w, height: h })
      .resize(target, Math.round(target / ratio), { fit: 'cover', withoutEnlargement: true })
    const buf = await (format === 'avif' ? img.avif({ quality: 55, effort: 4 }) : img.webp({ quality: 80 })).toBuffer()
    await uploads.setItemRaw(profileImageName(id, kind, target, format), buf)
  }))
  try {
    await Promise.all(jobs)
  }
  catch (e) {
    await removeProfileImage(id, kind)
    throw e
  }
  return id
}

export async function removeProfileImage(id: string | null, kind: ProfileImageKind) {
  if (!id) return
  const uploads = useStorage('uploads')
  await Promise.all(PROFILE_IMAGES[kind].widths.flatMap(w => IMAGE_FORMATS.map(f => uploads.removeItem(profileImageName(id, kind, w, f)))))
}

