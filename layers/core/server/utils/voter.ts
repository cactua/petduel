import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { ANON_VOTE_WEIGHT, NEW_ACCOUNT_VOTE_WEIGHT } from '#shared/models'
import { users, voteAlerts } from '../db/schema'
import { useDb } from './db'

const RECENT_SIZE = 8
const DUEL_TTL_MS = 10 * 60 * 1000

// Chi ha un account vota come "u:<id>"; chi non ce l'ha riceve un id anonimo nel cookie cifrato
export async function getVoter(event: H3Event) {
  const session = await getUserSession(event)
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

// In memoria: si azzera al riavvio, basta finché gira una sola istanza
const anonVotesByIp = new Map<string, number>()
let anonVotesDay = ''

function anonWeight(event: H3Event) {
  newDay()
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const count = (anonVotesByIp.get(ip) ?? 0) + 1
  anonVotesByIp.set(ip, count)
  return count > ANON_DAILY_CAP ? 0 : ANON_VOTE_WEIGHT
}

// Anche con l'account: oltre questo tetto giornaliero i voti restano registrati ma non spostano l'Elo
const USER_DAILY_CAP = 400
// Un account appena creato vota a metà peso per i primi giorni: crearne tanti per spingere qualcuno non conviene
const NEW_ACCOUNT_DAYS = 3
const userVotes = new Map<number, number>()

async function userWeight(userId: number) {
  newDay()
  const count = (userVotes.get(userId) ?? 0) + 1
  userVotes.set(userId, count)
  if (count > USER_DAILY_CAP) return 0
  const db = await useDb()
  const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId))
  const young = !user || Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_DAYS * 86_400_000
  return young ? NEW_ACCOUNT_VOTE_WEIGHT : 1
}

function newDay() {
  const today = new Date().toISOString().slice(0, 10)
  if (today === anonVotesDay) return
  anonVotesByIp.clear()
  userVotes.clear()
  anonVotesDay = today
}

/**
 * Raffiche: tanti voti per lo stesso partecipante dalla stessa rete in un'ora (cookie cancellati, più account).
 * Oltre la soglia quei voti non contano più e gli admin trovano un avviso tra le segnalazioni.
 * L'IP non si salva: solo un'impronta cifrata, che basta a distinguere le reti
 */
const BURST_WINDOW_MS = 60 * 60 * 1000
const BURST_LIMIT = 10
const bursts = new Map<string, number[]>()

async function burstGuard(event: H3Event, scope: string, winnerId: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const network = sign(`ip:${ip}`).slice(0, 16)
  const key = `${network}|${scope}|${winnerId}`
  const now = Date.now()
  const hits = [...(bursts.get(key) ?? []).filter(t => now - t < BURST_WINDOW_MS), now]
  bursts.set(key, hits)
  // Pulizia ogni tanto, perché la mappa non cresca all'infinito
  if (bursts.size > 50_000) for (const [k, v] of bursts) if (now - v.at(-1)! > BURST_WINDOW_MS) bursts.delete(k)
  if (hits.length <= BURST_LIMIT) return false
  const db = await useDb()
  await db.insert(voteAlerts).values({ petId: winnerId, scope, network, day: new Date().toISOString().slice(0, 10), hits: hits.length })
    .onConflictDoUpdate({ target: [voteAlerts.petId, voteAlerts.network, voteAlerts.day], set: { hits: sql`greatest(${voteAlerts.hits}, ${hits.length})` } })
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
  const weight = userId ? await userWeight(userId) : anonWeight(event)
  const burst = await burstGuard(event, scope, winnerId)
  return { voterId, winnerId, loserId, weight: burst ? 0 : weight }
}

function sign(payload: string) {
  const secret = useRuntimeConfig().voteSecret
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'NUXT_VOTE_SECRET non configurato' })
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
