import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { voteAlerts } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// L'admin ha visto l'avviso: sparisce dalla lista (i voti in eccesso restano comunque senza peso)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  await db.update(voteAlerts).set({ seenAt: new Date() }).where(eq(voteAlerts.id, id))
  return { ok: true }
})
