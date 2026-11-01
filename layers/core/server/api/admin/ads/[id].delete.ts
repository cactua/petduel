import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ads } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Elimina la campagna con le sue statistiche
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [ad] = await db.delete(ads).where(eq(ads.id, id)).returning({ image: ads.image, imageSource: ads.imageSource })
  if (!ad) throw createError({ statusCode: 404, statusMessage: 'errors.adNotFound' })
  await removeAdImage(ad.image, ad.imageSource)
  return { ok: true }
})
