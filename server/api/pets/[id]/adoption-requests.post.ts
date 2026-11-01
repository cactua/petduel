import { and, eq, gt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { adoptionRequests, pets, shelters } from '../../../db/schema'
import { adoptionRequestSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Richiesta di adozione: arriva al rifugio con l'email dell'account, così il rifugio non deve pubblicare i suoi contatti
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = adoptionRequestSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const db = await useDb()
  const [row] = await db.select({ pet: pets, shelterId: shelters.id }).from(pets)
    .innerJoin(shelters, and(eq(shelters.userId, pets.ownerId), eq(shelters.status, 'approved')))
    .where(eq(pets.id, id))
  if (!row || row.pet.adoption !== 'available') throw createError({ statusCode: 404, statusMessage: 'errors.notAdoptable' })
  if (row.pet.ownerId === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.ownShelterPet' })

  const [recent] = await db.select({ n: sql<number>`count(*)::int` }).from(adoptionRequests)
    .where(and(eq(adoptionRequests.userId, user.id), gt(adoptionRequests.createdAt, sql`now() - interval '1 day'`)))
  if ((recent?.n ?? 0) >= MAX_REQUESTS_PER_DAY) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManyRequests' })
  }

  const [created] = await db.insert(adoptionRequests)
    .values({ petId: id, shelterId: row.shelterId, userId: user.id, ...parsed.data })
    .onConflictDoNothing()
    .returning({ id: adoptionRequests.id })
  if (!created) throw createError({ statusCode: 409, statusMessage: 'errors.alreadyRequested' })
  return { ok: true }
})
