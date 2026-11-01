import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { pets } from '../../db/schema'
import { TOP_RANK } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { user } = await getUserSession(event)

  const db = await useDb()
  const [row] = await db.select({ ownerId: pets.ownerId, species: pets.species, elo: pets.elo, wins: pets.wins, hidden: pets.hideFromRankings }).from(pets).where(eq(pets.id, id))
  const isMine = !!row && row.ownerId === user?.id

  const [pet] = await loadGalleries(eq(pets.id, id), isMine)
  if (!pet || !row) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })

  // Posizione nella classifica di sempre della sua specie (solo se è in gara e tra i primi)
  let speciesRank: number | null = null
  if (pet.photos.some(p => p.status === 'approved') && !row.hidden && row.wins > 0) {
    const [ahead] = await db.select({ count: sql<number>`count(*)::int` }).from(pets)
      .where(and(eq(pets.species, row.species), aheadOf(row), hasApprovedPhoto, inRankings))
    const rank = (ahead?.count ?? 0) + 1
    if (rank <= TOP_RANK) speciesRank = rank
  }
  return { ...pet, isMine, speciesRank }
})
