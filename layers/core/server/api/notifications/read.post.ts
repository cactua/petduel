import { and, eq, isNull } from 'drizzle-orm'
import { notifications } from '../../db/schema'

// Aprire la campanella segna come letti tutti gli avvisi
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
  return { ok: true }
})
