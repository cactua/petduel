import { and, eq, inArray, sql } from 'drizzle-orm'
import { challengeEntries, challengeVotes } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const challenge = await getChallenge(getRouterParam(event, 'slug') ?? '')
  if (challengeStatus(challenge) !== 'active') throw createError({ statusCode: 409, statusMessage: 'errors.challengeEnded' })

  const { voterId, winnerId, loserId, weight } = await readVote(event, `c:${challenge.id}`)

  const db = await useDb()
  const delta = await db.transaction(async (tx) => {
    const rows = await tx.select({ id: challengeEntries.id, elo: challengeEntries.elo }).from(challengeEntries)
      .where(and(eq(challengeEntries.challengeId, challenge.id), inArray(challengeEntries.id, [winnerId, loserId])))
    const winner = rows.find(r => r.id === winnerId)
    const loser = rows.find(r => r.id === loserId)
    if (!winner || !loser) throw createError({ statusCode: 404, statusMessage: 'errors.entryNotFound' })

    const d = eloDelta(winner.elo, loser.elo) * weight
    const inserted = await tx.insert(challengeVotes)
      .values({ challengeId: challenge.id, voterId, pairKey: pairKey(winnerId, loserId), winnerId, loserId, delta: d })
      .onConflictDoNothing()
      .returning({ id: challengeVotes.id })
    if (!inserted.length) return null
    // Oltre il tetto anonimo il voto resta registrato ma non tocca né Elo né vittorie
    if (!weight) return 0

    await tx.update(challengeEntries).set({ elo: sql`${challengeEntries.elo} + ${d}`, wins: sql`${challengeEntries.wins} + 1` }).where(eq(challengeEntries.id, winnerId))
    await tx.update(challengeEntries).set({ elo: sql`${challengeEntries.elo} - ${d}`, losses: sql`${challengeEntries.losses} + 1` }).where(eq(challengeEntries.id, loserId))
    return d
  })

  if (delta === null) throw createError({ statusCode: 409, statusMessage: 'errors.alreadyVoted' })
  return { delta: Math.round(delta) }
})
