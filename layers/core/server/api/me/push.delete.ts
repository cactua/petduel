import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pushSubscriptions } from '../../db/schema'

// Spegne le notifiche push su questo dispositivo
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b => z.object({ endpoint: z.string().max(1000) }).safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  const db = await useDb()
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, body.data.endpoint)))
  return { ok: true }
})
