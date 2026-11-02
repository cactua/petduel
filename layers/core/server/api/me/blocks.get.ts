import { desc, eq } from 'drizzle-orm'
import { blocks, users } from '../../db/schema'

// Utenti bloccati, per sbloccarli dalla pagina account
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  const rows = await db.select({ username: users.username }).from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, user.id)).orderBy(desc(blocks.createdAt))
  return rows.map(r => r.username)
})
