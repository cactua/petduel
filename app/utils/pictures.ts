import { IMAGE_FORMATS, variantSrcset, type ImageVariant } from '#shared/images'

/**
 * <source> per la foto di un pet nel ritaglio giusto per dove compare, in AVIF e WebP e in più
 * misure (anche retina): il browser sceglie in base a `sizes`. Si usano dentro <picture>, con
 * l'<img src> di base come ripiego. `desktop`: un altro ritaglio da 760px in su.
 * Solo le foto caricate (/img/<id>.webp) hanno varianti: per il resto la lista è vuota.
 */
export function photoSources(src: string | null | undefined, variant: ImageVariant, sizes: string, desktop?: ImageVariant) {
  if (!src || !/^\/img\/[a-z0-9-]+\.webp$/.test(src)) return []
  const list = (v: ImageVariant, media?: string) => IMAGE_FORMATS.map(f => ({
    media, type: `image/${f}`, srcset: variantSrcset(src, v, f), sizes,
  }))
  return desktop ? [...list(desktop, '(min-width: 760px)'), ...list(variant)] : list(variant)
}
