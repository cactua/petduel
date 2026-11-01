import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../db/schema'

const bodySchema = z.object({ password: z.string().min(1).max(200) })

// Elimina il proprio account, dopo aver confermato la password
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const { password } = await readValidatedBody(event, bodySchema.parse)

  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.id))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  if (!await verifyPassword(user.passwordHash, password)) throw createError({ statusCode: 403, statusMessage: 'errors.wrongPassword' })
  // Il sito non può restare senza amministratori
  if (user.role === 'admin') {
    const [admins] = await db.select({ n: count() }).from(users).where(and(eq(users.role, 'admin')))
    if ((admins?.n ?? 0) <= 1) throw createError({ statusCode: 400, statusMessage: 'errors.lastAdmin' })
  }

  await deleteAccount(user.id)
  await clearUserSession(event)
  return { ok: true }
})
