import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { photos, pets } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Nuova foto nella gallery di un proprio pet
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  const db = await useDb()
  const [pet] = await db.select({ id: pets.id }).from(pets).where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
  if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  await assertPendingQuota(user.id)

  const { image } = await readPhotoUpload(event)
  await db.insert(photos).values({ petId: pet.id, image })
  return { petId: pet.id }
})
