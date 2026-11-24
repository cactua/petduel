import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'
import { passwordSchema } from '#shared/models'

const bodySchema = z.object({ token: z.string().max(200), password: passwordSchema })

// Password nuova dal link ricevuto per email. Tutte le sessioni aperte si chiudono (anche quelle di chi
// avesse rubato la password) e si entra su questo dispositivo. Aver aperto il link conferma anche l'email
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const { token, password } = parsed.data

  const db = await useDb()
  // Prima si controlla la password e poi si usa il codice: con una password non accettata il link resta buono
  const [owner] = await db.select().from(users).where(eq(users.id, await tokenOwner(token)))
  if (!owner || owner.bannedAt) throw createError({ statusCode: 400, statusMessage: 'errors.linkExpired' })
  if (password.toLowerCase().includes(owner.username) || password.toLowerCase() === owner.email) {
    throw createError({ statusCode: 400, statusMessage: 'errors.passwordContainsName' })
  }
  if (await consumeEmailToken(token, 'reset') !== owner.id) throw createError({ statusCode: 400, statusMessage: 'errors.linkExpired' })

  const [user] = await db.update(users).set({
    passwordHash: await hashPassword(password),
    sessionVersion: sql`${users.sessionVersion} + 1`,
    emailVerifiedAt: owner.emailVerifiedAt ?? new Date(),
  }).where(eq(users.id, owner.id)).returning()
  // Chi ha la password nuova non deve restare bloccato dai tentativi sbagliati di prima
  await clearLimit(`login:account:${owner.email}`)
  await startSession(event, user!)
  return { username: user!.username }
})

async function tokenOwner(token: string) {
  const userId = await peekEmailToken(token, 'reset')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'errors.linkExpired' })
  return userId
}
