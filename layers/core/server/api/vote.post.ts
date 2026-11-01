import { eq, inArray, sql } from 'drizzle-orm'
import { pets, votes } from '../db/schema'

export default defineEventHandler(async (event) => {
  const { voterId, winnerId, loserId, weight } = await readVote(event, 'main')

  const db = await useDb()
  const delta = await db.transaction(async (tx) => {
    const rows = await tx.select({ id: pets.id, elo: pets.elo }).from(pets).where(inArray(pets.id, [winnerId, loserId]))
    const winner = rows.find(r => r.id === winnerId)
    const loser = rows.find(r => r.id === loserId)
    if (!winner || !loser) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })

    // Il delta resta nel voto: serve alle classifiche di settimana e mese
    const d = eloDelta(winner.elo, loser.elo) * weight
    const inserted = await tx.insert(votes)
      .values({ voterId, pairKey: pairKey(winnerId, loserId), winnerId, loserId, delta: d })
      .onConflictDoNothing()
      .returning({ id: votes.id })
    if (!inserted.length) return null
    // Oltre il tetto anonimo il voto resta registrato ma non tocca né Elo né vittorie
    if (!weight) return 0

    await tx.update(pets).set({ elo: sql`${pets.elo} + ${d}`, wins: sql`${pets.wins} + 1` }).where(eq(pets.id, winnerId))
    await tx.update(pets).set({ elo: sql`${pets.elo} - ${d}`, losses: sql`${pets.losses} + 1` }).where(eq(pets.id, loserId))
    return d
  })

  if (delta === null) throw createError({ statusCode: 409, statusMessage: 'errors.alreadyVoted' })
  return { delta: Math.round(delta) }
})
