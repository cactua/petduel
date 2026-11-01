import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ads } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Interruttore veloce: attiva o metti in pausa
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { active } = await readValidatedBody(event, z.object({ active: z.boolean() }).parse)
  const db = await useDb()
  const [ad] = await db.update(ads).set({ active }).where(eq(ads.id, id)).returning({ id: ads.id })
  if (!ad) throw createError({ statusCode: 404, statusMessage: 'errors.adNotFound' })
  return { ok: true }
})
