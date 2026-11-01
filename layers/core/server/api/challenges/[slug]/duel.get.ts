import { and, eq, ne } from 'drizzle-orm'
import type { Duel, PublicPet } from '#shared/models'
import { challengeEntries, challengeVotes, photos, pets, users } from '../../../db/schema'

// Duello tra le partecipazioni della sfida. Qui "id" è l'id della partecipazione, non del pet.
export default defineEventHandler(async (event): Promise<Duel> => {
  const challenge = await getChallenge(getRouterParam(event, 'slug') ?? '')
  if (challengeStatus(challenge) !== 'active') throw createError({ statusCode: 409, statusMessage: 'errors.challengeNotActive' })

  const { voterId, userId } = await getVoter(event)
  const db = await useDb()

  const [entries, voted] = await Promise.all([
    db.select({ entry: challengeEntries, pet: pets, image: photos.image, credit: photos.credit, creditUrl: photos.creditUrl, owner: users.username })
      .from(challengeEntries)
      .innerJoin(photos, eq(photos.id, challengeEntries.photoId))
      .innerJoin(pets, eq(pets.id, challengeEntries.petId))
      .innerJoin(users, eq(users.id, pets.ownerId))
      .where(and(
        eq(challengeEntries.challengeId, challenge.id),
        eq(photos.status, 'approved'),
        inRankings,
        userId ? ne(pets.ownerId, userId) : undefined,
      )),
    db.select({ key: challengeVotes.pairKey }).from(challengeVotes)
      .where(and(eq(challengeVotes.challengeId, challenge.id), eq(challengeVotes.voterId, voterId))),
  ])

  // In una sfida tutti competono con tutti, anche tra specie diverse se la sfida è aperta
  const candidates = entries.map(e => ({ ...e.entry, species: 'sfida', row: e }))
  const pair = pickPair(candidates, new Set(voted.map(v => v.key)), [])
  if (!pair) return { pets: null, token: null }

  const toPet = ({ row }: (typeof candidates)[number]): PublicPet => ({
    id: row.entry.id,
    name: row.pet.name,
    species: row.pet.species,
    breed: row.pet.breed,
    city: row.pet.city,
    image: imageUrl(row.image),
    credit: photoCredit(row.credit, row.creditUrl),
    owner: row.owner,
  })
  const [a, b] = pair
  return {
    pets: [toPet(a), toPet(b)],
    token: issueDuelToken(voterId, [a.id, b.id], `c:${challenge.id}`),
  }
})
