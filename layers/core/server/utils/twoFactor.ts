import { and, eq, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users, type User } from '../db/schema'

// Verifica in due passaggi: il segreto si cifra con NUXT_TOTP_KEY, o con la chiave delle sessioni

export function totpKey() {
  const config = useRuntimeConfig()
  const key = config.totpKey || config.session.password
  if (!key) throw createError({ statusCode: 500, statusMessage: 'errors.generic' })
  return key
}

export function adminNeedsTotp() {
  const value = useRuntimeConfig().requireAdminTotp as unknown
  return value !== false && value !== 'false'
}

// Codici sbagliati nelle pagine dell'account (attivare, spegnere): pochi ogni 15 minuti
const CODE_WINDOW_MS = 15 * 60 * 1000
const MAX_CODE_FAILS = 8

/**
 * Controlla il codice dell'app o un codice di emergenza, e lo consuma: un codice dell'app non vale
 * una seconda volta, uno di emergenza sparisce. true se era giusto
 */
export async function consumeSecondFactor(user: Pick<User, 'id' | 'totpSecret' | 'totpLastStep' | 'totpRecovery'>, code: string) {
  const db = await useDb()
  if (user.totpSecret && /^\s*\d{3}\s?\d{3}\s*$/.test(code)) {
    let secret: string
    try {
      secret = openTotpSecret(user.totpSecret, totpKey())
    }
    catch {
      // Chiave cambiata: il segreto non si legge più, resta l'accesso con i codici di emergenza
      return false
    }
    const step = verifyTotp(secret, code, user.totpLastStep)
    if (step === null) return false
    // Condizione nell'update: due accessi allo stesso momento con lo stesso codice, ne passa uno
    const done = await db.update(users).set({ totpLastStep: step })
      .where(and(eq(users.id, user.id), sql`(${users.totpLastStep} is null or ${users.totpLastStep} < ${step})`))
      .returning({ id: users.id })
    return done.length > 0
  }
  if (isRecoveryCodeShape(code)) {
    const hash = hashRecoveryCode(code)
    if (!user.totpRecovery.includes(hash)) return false
    const done = await db.update(users)
      .set({ totpRecovery: sql`${users.totpRecovery} - ${hash}::text` })
      .where(and(eq(users.id, user.id), sql`${users.totpRecovery} ? ${hash}::text`))
      .returning({ id: users.id })
    return done.length > 0
  }
  return false
}

/** Come consumeSecondFactor, con il limite ai tentativi sbagliati; risponde 403/429 se non va */
export async function requireSecondFactor(user: Pick<User, 'id' | 'totpSecret' | 'totpLastStep' | 'totpRecovery'>, code: string) {
  const key = `totp:${user.id}`
  if (await peekLimit(key) >= MAX_CODE_FAILS) throw createError({ statusCode: 429, statusMessage: 'errors.tooManyLogins' })
  if (!await consumeSecondFactor(user, code)) {
    await hitLimit(key, CODE_WINDOW_MS)
    throw createError({ statusCode: 403, statusMessage: 'errors.wrongCode' })
  }
  await clearLimit(key)
}

export async function loadFullUser(event: H3Event) {
  const session = await requireUser(event)
  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.id))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  return user
}
