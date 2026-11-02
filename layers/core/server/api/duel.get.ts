import { and, eq, inArray, ne, notInArray } from 'drizzle-orm'
import { z } from 'zod'
import { pets, users, votes } from '../db/schema'
import { speciesFilterSchema, type Duel } from '#shared/models'

const querySchema = z.object({ species: speciesFilterSchema })

export default defineEventHandler(async (event): Promise<Duel> => {
  const { species } = await getValidatedQuery(event, querySchema.parse)
  const { voterId, recent, userId } = await getVoter(event)
  const db = await useDb()
  // Chi hai bloccato non compare nei tuoi duelli
  const blocked = userId ? await blockedBy(userId) : []

  const [candidates, voted] = await Promise.all([
    db.select().from(pets).where(and(
      species ? eq(pets.species, species) : undefined,
      userId ? ne(pets.ownerId, userId) : undefined, // i propri pet non si votano
      blocked.length ? notInArray(pets.ownerId, blocked) : undefined,
      hasApprovedPhoto,
    )),
    db.select({ key: votes.pairKey }).from(votes).where(eq(votes.voterId, voterId)),
  ])

  const pair = pickPair(candidates, new Set(voted.map(v => v.key)), recent)
  if (!pair) return { pets: null, token: null }

  const [a, b] = pair
  const [images, owners] = await Promise.all([
    randomApprovedImages([a.id, b.id]),
    db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, [a.ownerId, b.ownerId])),
  ])
  const owner = (id: number) => owners.find(o => o.id === id)?.username ?? ''
  const toPet = (p: typeof a) => {
    const { photoId, image, credit } = images.get(p.id)!
    return { ...toPublicPet(p, image, owner(p.ownerId), credit), photoId }
  }

  await rememberSeen(event, voterId, recent, [a.id, b.id])
  return {
    pets: [toPet(a), toPet(b)],
    token: issueDuelToken(voterId, [a.id, b.id]),
  }
})
