import { desc, eq, isNull } from 'drizzle-orm'
import { pets, users, voteAlerts } from '../../db/schema'
import type { VoteAlert } from '#shared/models'

// Raffiche di voti non ancora viste, la più recente prima. I voti oltre la soglia non hanno contato
export default defineEventHandler(async (event): Promise<VoteAlert[]> => {
  await requireAdmin(event)
  const db = await useDb()
  const rows = await db.select({ a: voteAlerts, name: pets.name, owner: users.username }).from(voteAlerts)
    .innerJoin(pets, eq(pets.id, voteAlerts.petId)).innerJoin(users, eq(users.id, pets.ownerId))
    .where(isNull(voteAlerts.seenAt)).orderBy(desc(voteAlerts.createdAt)).limit(100)
  const images = rows.length ? await randomApprovedImages(rows.map(r => r.a.petId)) : new Map()
  return rows.map(r => ({
    id: r.a.id,
    petId: r.a.petId,
    name: r.name,
    owner: r.owner,
    image: images.has(r.a.petId) ? imageUrl(images.get(r.a.petId)!.image) : null,
    challenge: r.a.scope !== 'main',
    hits: r.a.hits,
    day: r.a.day,
  }))
})
