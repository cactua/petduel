import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { loginSchema } from '#shared/models'

const INVALID = 'errors.wrongCredentials'

export default defineEventHandler(async (event) => {
  const parsed = loginSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: INVALID })
  const { email, password } = parsed.data

  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.email, email))

  // Stesso lavoro e stesso messaggio che l'email esista o no
  const valid = user && user.passwordHash !== '!'
    ? await verifyPassword(user.passwordHash, password)
    : (await verifyPassword(await getDummyHash(), password), false)
  if (!user || !valid) throw createError({ statusCode: 401, statusMessage: INVALID })
  if (user.bannedAt) throw createError({ statusCode: 403, statusMessage: 'errors.banned' })

  if (passwordNeedsReHash(user.passwordHash)) {
    await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id))
  }

  await startSession(event, user)
  return { username: user.username }
})
