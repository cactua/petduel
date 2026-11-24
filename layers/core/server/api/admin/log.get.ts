import { desc } from 'drizzle-orm'
import { adminLog } from '../../db/schema'

// Ultime azioni degli admin, dalla più recente
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await useDb()
  const rows = await db.select().from(adminLog).orderBy(desc(adminLog.createdAt)).limit(300)
  return rows.map(r => ({ id: r.id, admin: r.adminName, action: r.action, target: r.target, detail: r.detail, at: r.createdAt.toISOString() }))
})
