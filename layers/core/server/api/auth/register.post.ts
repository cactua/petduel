import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { signupSchema } from '#shared/models'

const RESERVED = new Set(['admin', 'administrator', 'moderatore', 'moderazione', 'petduel', 'support', 'staff', 'root'])

export default defineEventHandler(async (event) => {
  const raw = await readBody(event)
  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  }
  const { email, username, password } = parsed.data
  // Iscrizioni chiuse dall'admin (Impostazioni)
  const settings = await getSiteSettings()
  if (!settings.signupsOpen) throw createError({ statusCode: 403, statusMessage: 'errors.signupsClosed' })
  if (RESERVED.has(username)) throw createError({ statusCode: 400, statusMessage: 'errors.usernameUnavailable' })
  if (password.toLowerCase().includes(username) || password.toLowerCase() === email) {
    throw createError({ statusCode: 400, statusMessage: 'errors.passwordContainsName' })
  }

  const db = await useDb()
  const taken = await db.select({ email: users.email, username: users.username }).from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
  if (taken.some(t => t.username === username)) throw createError({ statusCode: 409, statusMessage: 'errors.usernameTaken' })
  if (taken.length) throw createError({ statusCode: 409, statusMessage: 'errors.emailTakenLogin' })

  // Account nuovi al giorno dalla stessa rete: una famiglia o un ufficio ci stanno, una fabbrica di account no
  if (await hitLimit(`signup:network:${networkOf(event)}`, 86_400_000) > settings.maxSignupsPerNetwork) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManySignups' })
  }

  const [user] = await db.insert(users)
    .values({ email, username, passwordHash: await hashPassword(password), rulesAcceptedAt: new Date() })
    .onConflictDoNothing()
    .returning()
  if (!user) throw createError({ statusCode: 409, statusMessage: 'errors.emailOrUsernameTaken' })

  await startSession(event, user)
  // Link per confermare l'email: se l'invio non riesce l'account c'è lo stesso, e il link si richiede dal profilo
  await sendVerifyEmail(event, user, mailLocale((raw as { locale?: unknown } | null)?.locale))
  return { username: user.username }
})
