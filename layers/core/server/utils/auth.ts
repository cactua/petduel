import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users, type User } from '../db/schema'

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
  return user
}

export async function loadSessionUser(user: { id: number, username: string }) {
  const db = await useDb()
  const [row] = await db.select({ id: users.id, username: users.username, role: users.role, bannedAt: users.bannedAt, rulesAcceptedAt: users.rulesAcceptedAt })
    .from(users).where(eq(users.id, user.id))
  // Un account sospeso perde subito la sessione
  if (!row || row.username !== user.username || row.bannedAt) return null
  return { id: row.id, username: row.username, role: row.role, needsRules: !row.rulesAcceptedAt }
}

export async function isAdmin(userId: number) {
  const db = await useDb()
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId))
  return row?.role === 'admin'
}

export async function startSession(event: H3Event, user: User) {
  await replaceUserSession(event, {
    user: { id: user.id, username: user.username, role: user.role, needsRules: !user.rulesAcceptedAt },
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
