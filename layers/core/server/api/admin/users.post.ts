import { eq, or } from 'drizzle-orm'
import { adminUserCreateSchema } from '#shared/models'
import { users } from '../../db/schema'

// Crea un account (es. per un rifugio o un collaboratore); la sessione dell'admin non cambia
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = adminUserCreateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const { email, username, password, role } = parsed.data

  const db = await useDb()
  const taken = await db.select({ username: users.username }).from(users).where(or(eq(users.email, email), eq(users.username, username)))
  if (taken.some(t => t.username === username)) throw createError({ statusCode: 409, statusMessage: 'errors.usernameTaken' })
  if (taken.length) throw createError({ statusCode: 409, statusMessage: 'errors.emailTaken' })

  const [user] = await db.insert(users).values({ email, username, role, passwordHash: await hashPassword(password) })
    .onConflictDoNothing().returning({ id: users.id, username: users.username })
  if (!user) throw createError({ statusCode: 409, statusMessage: 'errors.emailOrUsernameTaken' })
  return user
})
