import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ModerationItem } from '#shared/models'
import { photos, pets, users } from '../../db/schema'

const querySchema = z.object({ status: z.enum(['pending', 'approved']).default('pending') })

// Coda di approvazione (le più vecchie per prime) oppure le ultime approvate, per toglierne una
export default defineEventHandler(async (event): Promise<ModerationItem[]> => {
  await requireAdmin(event)
  const { status } = await getValidatedQuery(event, querySchema.parse)
  const db = await useDb()
  const rows = await db.select({
    id: photos.id,
    image: photos.image,
    createdAt: photos.createdAt,
    petId: pets.id,
    petName: pets.name,
    species: pets.species,
    approvedPhotos: sql<number>`(select count(*)::int from ${photos} p2 where p2.pet_id = ${pets.id} and p2.status = 'approved')`,
    owner: users.username,
    challenge: sql<string | null>`(select c.title from challenge_entries e join challenges c on c.id = e.challenge_id where e.photo_id = ${photos.id} limit 1)`,
  })
    .from(photos)
    .innerJoin(pets, eq(pets.id, photos.petId))
    .innerJoin(users, eq(users.id, pets.ownerId))
    // Le foto di esempio (con autore citato) non sono degli utenti: fuori dalle approvate
    .where(status === 'pending' ? eq(photos.status, 'pending') : and(eq(photos.status, 'approved'), isNull(photos.credit)))
    .orderBy(status === 'pending' ? asc(photos.createdAt) : desc(photos.reviewedAt))
    .limit(status === 'pending' ? 100 : 60)

  return rows.map(r => ({
    id: r.id,
    image: imageUrl(r.image),
    createdAt: r.createdAt.toISOString(),
    pet: { id: r.petId, name: r.petName, species: r.species, approvedPhotos: r.approvedPhotos },
    owner: r.owner,
    challenge: r.challenge,
  }))
})
