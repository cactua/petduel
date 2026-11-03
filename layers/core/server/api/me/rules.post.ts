import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'

// Accetta le regole della community (per chi si era iscritto prima che ci fossero)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  await db.update(users).set({ rulesAcceptedAt: new Date() }).where(eq(users.id, user.id))
  const session = await getUserSession(event)
  await setUserSession(event, { user: { ...session.user!, needsRules: false } })
  return { ok: true }
})
