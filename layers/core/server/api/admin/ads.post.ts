import { ads } from '../../db/schema'

// Nuova campagna (modulo multipart con immagine facoltativa e il suo ritaglio)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { fields, source } = await readAdUpload(event)
  let image: string | null = null
  try {
    const values = await parseAdFields(fields)
    let crop = null
    if (source) ({ image, crop } = await renderAdImage(source, parseAdCrop(fields.crop)))
    const db = await useDb()
    const [ad] = await db.insert(ads)
      .values({ ...values, image, imageSource: source, imageCrop: crop && JSON.stringify(crop) })
      .returning({ id: ads.id })
    return { id: ad!.id }
  }
  catch (e) {
    await removeAdImage(source, image)
    throw e
  }
})
