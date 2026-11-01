import { z } from 'zod'

/**
 * Ritagli di ogni foto, scelti da chi la carica, e le larghezze generate per ciascuno.
 * Le larghezze coprono gli schermi normali e quelli retina (2x, 3x): il browser sceglie da srcset.
 *
 * I file hanno nomi prevedibili: /img/<id>.webp è la foto "di base" (verticale 900×1200),
 * /img/<id>-<ritaglio><larghezza>.<avif|webp> sono le varianti. Così non serve salvarle nel database.
 */
export const IMAGE_VARIANTS = {
  v: { label: 'Verticale', ratio: 3 / 4, widths: [360, 720, 1080], uses: 'Duelli su computer, galleria, podio' },
  h: { label: 'Orizzontale', ratio: 3 / 2, widths: [480, 960, 1440], uses: 'Duelli su telefono' },
  s: { label: 'Quadrata', ratio: 1, widths: [160, 320, 640, 1080], uses: 'Profilo, classifiche, card da condividere' },
} as const
export type ImageVariant = keyof typeof IMAGE_VARIANTS
export const VARIANT_KEYS = Object.keys(IMAGE_VARIANTS) as ImageVariant[]
export const IMAGE_FORMATS = ['avif', 'webp'] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

// Ritaglio in frazioni (0-1) dell'immagine già raddrizzata secondo l'EXIF
const frac = z.number().min(0).max(1)
export const cropSchema = z.object({ x: frac, y: frac, w: frac.gt(0), h: frac.gt(0) })
  .refine(c => c.x + c.w <= 1.001 && c.y + c.h <= 1.001, 'Ritaglio fuori dall\'immagine')
export type Crop = z.infer<typeof cropSchema>
export const cropsSchema = z.object({ v: cropSchema, h: cropSchema, s: cropSchema })
export type Crops = z.infer<typeof cropsSchema>

/** Nome file di una variante, a partire dal nome della foto di base ("<id>.webp") */
export const variantName = (image: string, variant: ImageVariant, width: number, format: ImageFormat) =>
  `${image.replace(/\.webp$/, '')}-${variant}${width}.${format}`

/** Riconosce "<id>.webp" e "<id>-<ritaglio><larghezza>.<formato>"; null se il nome non è valido */
export function parseImageName(name: string) {
  const m = /^([a-z0-9-]+?)(?:-([vhs])(\d{2,4}))?\.(webp|avif|svg)$/.exec(name)
  if (!m) return null
  const [, id, variant, width, format] = m
  if (!variant) return format === 'avif' ? null : { image: `${id}.${format}`, variant: null }
  if (!(IMAGE_VARIANTS[variant as ImageVariant].widths as readonly number[]).includes(Number(width))) return null
  if (format === 'svg') return null
  return { image: `${id}.webp`, variant: { variant: variant as ImageVariant, width: Number(width), format: format as ImageFormat } }
}

/** srcset di un ritaglio in un formato, a partire dall'URL della foto di base (/img/<id>.webp) */
export function variantSrcset(src: string, variant: ImageVariant, format: ImageFormat) {
  return IMAGE_VARIANTS[variant].widths.map(w => `${variantName(src, variant, w, format)} ${w}w`).join(', ')
}

/**
 * Immagini della pagina di un rifugio: banner largo e logo quadrato.
 * File: <id>-b<larghezza>.<formato> e <id>-l<larghezza>.<formato>, serviti da /shelter-img/.
 */
export const SHELTER_IMAGES = {
  banner: { code: 'b', ratio: 5 / 2, widths: [800, 1600] },
  logo: { code: 'l', ratio: 1, widths: [160, 320] },
} as const
export type ShelterImageKind = keyof typeof SHELTER_IMAGES
export const SHELTER_IMAGE_KINDS = Object.keys(SHELTER_IMAGES) as ShelterImageKind[]

export const shelterImageName = (id: string, kind: ShelterImageKind, width: number, format: ImageFormat) =>
  `${id}-${SHELTER_IMAGES[kind].code}${width}.${format}`

export function parseShelterImageName(name: string) {
  const m = /^([a-f0-9-]{36})-([bl])(\d{3,4})\.(webp|avif)$/.exec(name)
  if (!m) return null
  const kind: ShelterImageKind = m[2] === 'b' ? 'banner' : 'logo'
  const width = Number(m[3])
  if (!(SHELTER_IMAGES[kind].widths as readonly number[]).includes(width)) return null
  return { id: m[1]!, kind, width, format: m[4] as ImageFormat }
}

/** src e srcset (AVIF, WebP) di un'immagine del rifugio */
export function shelterImageSources(id: string, kind: ShelterImageKind) {
  const { widths } = SHELTER_IMAGES[kind]
  const set = (format: ImageFormat) => widths.map(w => `/shelter-img/${shelterImageName(id, kind, w, format)} ${w}w`).join(', ')
  return { src: `/shelter-img/${shelterImageName(id, kind, widths[widths.length - 1]!, 'webp')}`, avif: set('avif'), webp: set('webp') }
}

/** Ritaglio centrato più grande possibile, per l'immagine di dimensioni date */
export function centeredCrop(width: number, height: number, ratio: number): Crop {
  const w = Math.min(1, (height * ratio) / width)
  const h = Math.min(1, width / ratio / height)
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}
