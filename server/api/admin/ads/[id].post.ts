import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ads } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Modifica di una campagna. Con una nuova immagine si riparte da quella; senza, se è cambiato
// il ritaglio si rifà dall'originale già caricato. "removeImage" toglie l'immagine
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [old] = await db.select({ image: ads.image, imageSource: ads.imageSource, imageCrop: ads.imageCrop }).from(ads).where(eq(ads.id, id))
  if (!old) throw createError({ statusCode: 404, statusMessage: 'errors.adNotFound' })

  const { fields, source: uploaded } = await readAdUpload(event)
  let rendered: string | null = null
  try {
    const values = await parseAdFields(fields)
    const crop = parseAdCrop(fields.crop)
    let next = { image: old.image, imageSource: old.imageSource, imageCrop: old.imageCrop }
    if (uploaded) {
      const r = await renderAdImage(uploaded, crop)
      rendered = r.image
      next = { image: r.image, imageSource: uploaded, imageCrop: JSON.stringify(r.crop) }
    }
    else if (fields.removeImage === 'true') {
      next = { image: null, imageSource: null, imageCrop: null }
    }
    else if (crop && old.image && JSON.stringify(crop) !== old.imageCrop) {
      // Campagne create prima del ritaglio non hanno l'originale: si parte dall'immagine attuale
      const source = old.imageSource ?? old.image
      const r = await renderAdImage(source, crop)
      rendered = r.image
      next = { image: r.image, imageSource: source, imageCrop: JSON.stringify(r.crop) }
    }
    await db.update(ads).set({ ...values, ...next }).where(eq(ads.id, id))
    // File non più usati: immagine finale e originale vecchi, se sono cambiati
    const used = new Set([next.image, next.imageSource])
    await removeAdImage(...[old.image, old.imageSource].filter(f => !used.has(f)))
    return { id }
  }
  catch (e) {
    await removeAdImage(uploaded, rendered)
    throw e
  }
})
