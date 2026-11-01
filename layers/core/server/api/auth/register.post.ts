import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { registerSchema } from '#shared/models'

const RESERVED = new Set(['admin', 'administrator', 'moderatore', 'moderazione', 'petduel', 'support', 'staff', 'root'])

export default defineEventHandler(async (event) => {
  const parsed = registerSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  }
  const { email, username, password } = parsed.data
  if (RESERVED.has(username)) throw createError({ statusCode: 400, statusMessage: 'errors.usernameUnavailable' })
  if (password.toLowerCase().includes(username) || password.toLowerCase() === email) {
    throw createError({ statusCode: 400, statusMessage: 'errors.passwordContainsName' })
  }

  const db = await useDb()
  const taken = await db.select({ email: users.email, username: users.username }).from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
  if (taken.some(t => t.username === username)) throw createError({ statusCode: 409, statusMessage: 'errors.usernameTaken' })
  if (taken.length) throw createError({ statusCode: 409, statusMessage: 'errors.emailTakenLogin' })

  const [user] = await db.insert(users)
    .values({ email, username, passwordHash: await hashPassword(password) })
    .onConflictDoNothing()
    .returning()
  if (!user) throw createError({ statusCode: 409, statusMessage: 'errors.emailOrUsernameTaken' })

  await startSession(event, user)
  return { username: user.username }
})
