import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { NotificationList } from '#shared/models'
import { notifications } from '../db/schema'

const LIST_SIZE = 20

export default defineEventHandler(async (event): Promise<NotificationList> => {
  const user = await requireUser(event)
  await refreshNotifications(user.id)

  const db = await useDb()
  const [rows, [unread]] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(LIST_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ])
  return {
    items: rows.map(n => ({ id: n.id, emoji: n.emoji, text: n.text, params: n.params ? JSON.parse(n.params) : null, link: n.link, read: !!n.readAt, createdAt: n.createdAt.toISOString() })),
    unread: unread?.n ?? 0,
  }
})
