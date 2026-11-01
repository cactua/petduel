import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { ANON_VOTE_WEIGHT } from '#shared/models'

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
  const today = new Date().toISOString().slice(0, 10)
  if (today !== anonVotesDay) {
    anonVotesByIp.clear()
    anonVotesDay = today
  }
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const count = (anonVotesByIp.get(ip) ?? 0) + 1
  anonVotesByIp.set(ip, count)
  return count > ANON_DAILY_CAP ? 0 : ANON_VOTE_WEIGHT
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
  return { voterId, winnerId, loserId, weight: userId ? 1 : anonWeight(event) }
}

function sign(payload: string) {
  const secret = useRuntimeConfig().voteSecret
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'NUXT_VOTE_SECRET non configurato' })
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
