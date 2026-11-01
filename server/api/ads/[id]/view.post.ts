import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { adEvents, ads } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// L'annuncio è stato davvero mostrato (lo chiama la card quando compare)
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { voterId } = await getVoter(event)
  const db = await useDb()
  const [ad] = await db.select({ id: ads.id }).from(ads).where(eq(ads.id, id))
  if (!ad) throw createError({ statusCode: 404 })
  await db.insert(adEvents).values({ adId: id, type: 'view', voterId, ...adEventPlace(event) })
  return { ok: true }
})
