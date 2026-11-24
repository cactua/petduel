import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { loginSchema } from '#shared/models'

const INVALID = 'errors.wrongCredentials'
// Tentativi sbagliati ogni 15 minuti: per account (chi cambia IP non può provare password all'infinito)
// e per rete (chi prova tante email diverse)
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS_PER_ACCOUNT = 8
const MAX_FAILS_PER_NETWORK = 30

export default defineEventHandler(async (event) => {
  const parsed = loginSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: INVALID })
  const { email, password, code } = parsed.data

  const accountKey = `login:account:${email}`
  const networkKey = `login:network:${networkOf(event)}`
  if (await peekLimit(accountKey) >= MAX_FAILS_PER_ACCOUNT || await peekLimit(networkKey) >= MAX_FAILS_PER_NETWORK) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManyLogins' })
  }

  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.email, email))

  // Stesso lavoro e stesso messaggio che l'email esista o no
  const valid = user && user.passwordHash !== '!'
    ? await verifyPassword(user.passwordHash, password)
    : (await verifyPassword(await getDummyHash(), password), false)
  if (!user || !valid) {
    await Promise.all([hitLimit(accountKey, WINDOW_MS), hitLimit(networkKey, WINDOW_MS)])
    throw createError({ statusCode: 401, statusMessage: INVALID })
  }
  if (user.bannedAt) throw createError({ statusCode: 403, statusMessage: 'errors.banned' })

  // Verifica in due passaggi: password giusta, ora serve il codice. I codici sbagliati contano
  // come password sbagliate, così non si possono provare tutti
  if (user.totpEnabledAt) {
    if (!code) return { totp: true }
    if (!await consumeSecondFactor(user, code)) {
      await Promise.all([hitLimit(accountKey, WINDOW_MS), hitLimit(networkKey, WINDOW_MS)])
      throw createError({ statusCode: 401, statusMessage: 'errors.wrongCode' })
    }
  }
  await clearLimit(accountKey)

  if (passwordNeedsReHash(user.passwordHash)) {
    await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id))
  }

  await startSession(event, user)
  return { username: user.username }
})
