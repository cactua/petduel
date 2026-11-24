import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { pushSubscriptions } from '../../db/schema'

// Esci da tutti gli altri dispositivi: le loro sessioni non valgono più, questa resta aperta.
// Anche le notifiche push smettono di arrivare lì (resta solo quella di questo dispositivo, se c'è)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await revokeOtherSessions(event, user.id)
  const body = await readValidatedBody(event, b => z.object({ keepPush: z.string().max(1000).optional() }).catch({}).parse(b ?? {}))
  const db = await useDb()
  await db.delete(pushSubscriptions).where(and(
    eq(pushSubscriptions.userId, user.id),
    body.keepPush ? ne(pushSubscriptions.endpoint, body.keepPush) : undefined,
  ))
  return { ok: true }
})
