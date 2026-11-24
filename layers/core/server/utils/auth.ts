import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { revokedSessions, users, type User } from '../db/schema'

// L'utente della sessione si rilegge dal database: un account eliminato o un ruolo
// cambiato hanno effetto subito, non quando scade il cookie
export async function requireUser(event: H3Event) {
  const { user } = await requireUserSession(event, { statusCode: 401, message: 'errors.loginRequired' })
  const current = await loadSessionUser(user)
  if (!current) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'errors.sessionExpired' })
  }
  return current
}

export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'errors.adminOnly' })
  // Chi gestisce il sito entra solo con la verifica in due passaggi: una password rubata non basta.
  // Attivarla chiude le altre sessioni, quindi ogni sessione con totp è passata dal codice
  if (adminNeedsTotp() && !user.totp) throw createError({ statusCode: 403, statusMessage: 'errors.totpRequired' })
  // Per il registro delle azioni admin (plugin adminLog)
  event.context.admin = { id: user.id, username: user.username }
  return user
}

export async function loadSessionUser(user: { id: number, username: string, sessionVersion?: number, sid?: string }) {
  const db = await useDb()
  const [row] = await db.select({
    id: users.id, username: users.username, role: users.role, bannedAt: users.bannedAt, rulesAcceptedAt: users.rulesAcceptedAt,
    sessionVersion: users.sessionVersion, emailVerifiedAt: users.emailVerifiedAt, totpEnabledAt: users.totpEnabledAt,
    // Sessione chiusa con "Esci": il cookie non vale più neanche se qualcuno ne aveva una copia
    revoked: user.sid
      ? sql<boolean>`exists (select 1 from ${revokedSessions} where ${revokedSessions.sid} = ${user.sid})`
      : sql<boolean>`false`,
  }).from(users).where(eq(users.id, user.id))
  // Un account sospeso perde subito la sessione, e così una sessione chiusa da "Esci da tutti i dispositivi"
  if (!row || row.username !== user.username || row.bannedAt) return null
  if ((user.sessionVersion ?? 0) !== row.sessionVersion || row.revoked) return null
  return { id: row.id, username: row.username, role: row.role, needsRules: !row.rulesAcceptedAt, sessionVersion: row.sessionVersion, emailVerified: !!row.emailVerifiedAt, totp: !!row.totpEnabledAt, sid: user.sid }
}

/**
 * Chiude tutte le sessioni dell'account (gli altri dispositivi vengono disconnessi alla prossima richiesta)
 * e ne riapre una nuova su questo dispositivo
 */
export async function revokeOtherSessions(event: H3Event, userId: number) {
  const db = await useDb()
  const [user] = await db.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId)).returning()
  await startSession(event, user!)
}

export async function isAdmin(userId: number) {
  const db = await useDb()
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId))
  return row?.role === 'admin'
}

export async function startSession(event: H3Event, user: User) {
  await replaceUserSession(event, {
    // sid: codice di questa sessione, per poterla chiudere da sola all'uscita (non serve ad accedere)
    user: { id: user.id, username: user.username, role: user.role, needsRules: !user.rulesAcceptedAt, sessionVersion: user.sessionVersion, emailVerified: !!user.emailVerifiedAt, totp: !!user.totpEnabledAt, sid: randomUUID() },
    loggedInAt: Date.now(),
    voterId: `u:${user.id}`,
    recent: [],
  })
}

// Hash fittizio: se l'email non esiste si verifica comunque una password,
// così il tempo di risposta non rivela quali email sono registrate
let dummyHash: Promise<string> | undefined
export function getDummyHash() {
  dummyHash ??= hashPassword('password-fittizia-per-il-timing')
  return dummyHash
}

// Conferma della password da dentro l'account (eliminarlo, cambiare password): pochi tentativi sbagliati
// ogni 15 minuti, così chi trova una sessione aperta non può indovinarla
const CONFIRM_WINDOW_MS = 15 * 60 * 1000
const MAX_CONFIRM_FAILS = 8

export async function confirmPassword(user: { id: number, passwordHash: string }, password: string) {
  const key = `password:${user.id}`
  if (await peekLimit(key) >= MAX_CONFIRM_FAILS) throw createError({ statusCode: 429, statusMessage: 'errors.tooManyLogins' })
  if (user.passwordHash === '!' || !await verifyPassword(user.passwordHash, password)) {
    await hitLimit(key, CONFIRM_WINDOW_MS)
    throw createError({ statusCode: 403, statusMessage: 'errors.wrongPassword' })
  }
  await clearLimit(key)
}

/**
 * Utente della sessione, ricontrollato nel database, per le pagine che si vedono anche senza account ma
 * mostrano di più al proprietario. null se non è collegato, o se la sessione non vale più (account
 * sospeso o eliminato, "Esci da tutti i dispositivi")
 */
export async function optionalUser(event: H3Event) {
  const { user } = await getUserSession(event)
  return user ? await loadSessionUser(user) : null
}

/** Chiude questa sessione: il cookie, anche se copiato, non vale più fino alla sua scadenza naturale */
export async function revokeSession(sid: string | undefined) {
  if (!sid) return
  const db = await useDb()
  const maxAge = Number(useRuntimeConfig().session.maxAge) || 60 * 60 * 24 * 30
  await db.insert(revokedSessions).values({ sid, expiresAt: new Date(Date.now() + maxAge * 1000) }).onConflictDoNothing()
}

export async function purgeRevokedSessions() {
  const db = await useDb()
  await db.delete(revokedSessions).where(sql`${revokedSessions.expiresAt} < now()`)
}
