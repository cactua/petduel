import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { ANON_VOTE_WEIGHT } from '#shared/models'
import { BURST_WINDOW_MS, accountVoteWeight, burstWindow, isBurst } from '#shared/voteRules'
import { users, voteAlerts } from '../db/schema'
import { useDb } from './db'
import { hitLimit, networkOf } from './rateLimit'

const RECENT_SIZE = 8
const DUEL_TTL_MS = 10 * 60 * 1000

// Chi ha un account vota come "u:<id>"; chi non ce l'ha riceve un id anonimo nel cookie cifrato
export async function getVoter(event: H3Event) {
  let session = await getUserSession(event)
  // Un account sospeso o una sessione chiusa da un altro dispositivo non votano più come utente
  if (session.user && !await loadSessionUser(session.user)) {
    await clearUserSession(event)
    session = await getUserSession(event)
  }
  const voterId = session.user ? `u:${session.user.id}` : session.voterId
  if (voterId && voterId === session.voterId) {
    return { voterId, recent: session.recent ?? [], userId: session.user?.id }
  }
  const fresh = voterId ?? randomUUID()
  await saveVoter(event, fresh, [])
  return { voterId: fresh, recent: [] as number[], userId: session.user?.id }
}

export async function rememberSeen(event: H3Event, voterId: string, recent: number[], ids: number[]) {
  await saveVoter(event, voterId, [...recent, ...ids].slice(-RECENT_SIZE))
}

async function saveVoter(event: H3Event, voterId: string, recent: number[]) {
  // replace (non merge): con il merge gli array verrebbero concatenati
  const { user, loggedInAt } = await getUserSession(event)
  await replaceUserSession(event, { user, loggedInAt, voterId, recent })
}

// Il token firmato lega il voto a una coppia emessa dal server per quel votante.
// "scope" distingue i duelli generali ("main") da quelli di ogni sfida ("c:<id>"),
// così un token non si può riusare altrove.
export function issueDuelToken(voterId: string, ids: [number, number], scope = 'main') {
  const payload = Buffer.from(JSON.stringify({ v: voterId, p: ids, t: Date.now(), s: scope })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readDuelToken(token: string) {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { v: string, p: [number, number], t: number, s?: string }
  if (Date.now() - data.t > DUEL_TTL_MS) return null
  return data
}

// Sotto questo tempo dall'emissione della coppia il voto è quasi certamente un bot
const MIN_VOTE_MS = 300

const voteBodySchema = z.object({
  token: z.string().max(1000),
  winnerId: z.number().int(),
})

// Chi non ha un account può cambiare id cancellando il cookie: i suoi voti pesano meno
// e, oltre un tetto giornaliero per IP, restano registrati ma non spostano più l'Elo
const ANON_DAILY_CAP = 100

const DAY_MS = 86_400_000

// Contatori nel database (server/utils/rateLimit.ts): valgono anche dopo un riavvio e con più server
async function anonWeight(event: H3Event) {
  const count = await hitLimit(`vote:anon:${networkOf(event)}:${today()}`, DAY_MS)
  return count > ANON_DAILY_CAP ? 0 : ANON_VOTE_WEIGHT
}

// Voti di oggi per account: tetto giornaliero e peso ridotto per gli account nuovi (shared/voteRules.ts)
async function userWeight(userId: number) {
  const count = await hitLimit(`vote:user:${userId}:${today()}`, DAY_MS)
  const db = await useDb()
  const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId))
  return accountVoteWeight(count, user?.createdAt ?? null)
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Raffiche: tanti voti per lo stesso partecipante dalla stessa rete in un'ora (cookie cancellati, più account).
 * Oltre la soglia quei voti non contano più e gli admin trovano un avviso tra le segnalazioni.
 * L'IP non si salva: solo un'impronta cifrata, che basta a distinguere le reti
 */
async function burstGuard(event: H3Event, scope: string, winnerId: number) {
  const network = networkOf(event)
  const hits = await hitLimit(`vote:burst:${network}:${scope}:${winnerId}:${burstWindow()}`, BURST_WINDOW_MS)
  if (!isBurst(hits)) return false
  const db = await useDb()
  await db.insert(voteAlerts).values({ petId: winnerId, scope, network, day: today(), hits })
    .onConflictDoUpdate({ target: [voteAlerts.petId, voteAlerts.network, voteAlerts.day], set: { hits: sql`greatest(${voteAlerts.hits}, ${hits})` } })
  return true
}

/** Legge e verifica un voto: token valido, dello stesso votante, dello scope giusto, non troppo veloce. */
export async function readVote(event: H3Event, scope: string) {
  const { token, winnerId } = await readValidatedBody(event, voteBodySchema.parse)
  const { voterId, userId } = await getVoter(event)

  const duel = readDuelToken(token)
  if (!duel || duel.v !== voterId || duel.s !== scope || !duel.p.includes(winnerId)) {
    throw createError({ statusCode: 400, statusMessage: 'errors.duelExpired' })
  }
  if (Date.now() - duel.t < MIN_VOTE_MS) {
    throw createError({ statusCode: 429, statusMessage: 'errors.voteTooFast' })
  }
  const loserId = duel.p[0] === winnerId ? duel.p[1] : duel.p[0]
  const weight = userId ? await userWeight(userId) : await anonWeight(event)
  const burst = await burstGuard(event, scope, winnerId)
  return { voterId, winnerId, loserId, weight: burst ? 0 : weight }
}

function sign(payload: string) {
  const secret = useRuntimeConfig().voteSecret
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'NUXT_VOTE_SECRET non configurato' })
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
