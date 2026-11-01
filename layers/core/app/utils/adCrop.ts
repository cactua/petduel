import type { AdCrop } from '#shared/models'

// L'originale dentro la cornice 4:3 dell'annuncio, in percentuale della cornice.
// Con un ritaglio più grande dell'immagine (rimpicciolita) le percentuali scendono sotto il 100%
export function adCropStyle(crop: Pick<AdCrop, 'x' | 'y' | 'w' | 'h'>) {
  return {
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
  }
}
