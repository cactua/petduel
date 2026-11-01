import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { challengeEntries, challenges } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Si possono eliminare solo le sfide senza partecipanti: quelle con foto in gara restano nello storico
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()

  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(challengeEntries).where(eq(challengeEntries.challengeId, id))
  if (row?.n) throw createError({ statusCode: 409, statusMessage: 'errors.challengeHasEntries' })

  const deleted = await db.delete(challenges).where(eq(challenges.id, id)).returning({ id: challenges.id })
  if (!deleted.length) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })
  return { ok: true }
})
