import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lt } from 'drizzle-orm'
import { emailTokens, type EmailTokenKind } from '../db/schema'
import { useDb } from './db'

// Codici dei link mandati per email. Nel database c'è solo l'impronta: chi legge il database non può usarli
const LIFETIME_MS: Record<EmailTokenKind, number> = {
  verify: 48 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
}

const digest = (token: string) => createHash('sha256').update(token).digest('base64url')

/** Codice nuovo; quelli dello stesso tipo chiesti prima per lo stesso account non valgono più */
export async function createEmailToken(userId: number, kind: EmailTokenKind) {
  const token = randomBytes(32).toString('base64url')
  const db = await useDb()
  await db.delete(emailTokens).where(and(eq(emailTokens.userId, userId), eq(emailTokens.kind, kind)))
  await db.insert(emailTokens).values({ userId, kind, tokenHash: digest(token), expiresAt: new Date(Date.now() + LIFETIME_MS[kind]) })
  return token
}

/** Usa il codice (una volta sola): restituisce l'account, o null se è sbagliato, già usato o scaduto */
export async function consumeEmailToken(token: string, kind: EmailTokenKind) {
  if (!/^[\w-]{20,100}$/.test(token)) return null
  const db = await useDb()
  const [row] = await db.delete(emailTokens)
    .where(and(eq(emailTokens.tokenHash, digest(token)), eq(emailTokens.kind, kind), gt(emailTokens.expiresAt, new Date())))
    .returning({ userId: emailTokens.userId })
  return row?.userId ?? null
}

/** Controlla il codice senza usarlo: l'account a cui appartiene, o null */
export async function peekEmailToken(token: string, kind: EmailTokenKind) {
  if (!/^[\w-]{20,100}$/.test(token)) return null
  const db = await useDb()
  const [row] = await db.select({ userId: emailTokens.userId }).from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, digest(token)), eq(emailTokens.kind, kind), gt(emailTokens.expiresAt, new Date())))
  return row?.userId ?? null
}

export async function purgeEmailTokens() {
  const db = await useDb()
  await db.delete(emailTokens).where(lt(emailTokens.expiresAt, new Date()))
}
