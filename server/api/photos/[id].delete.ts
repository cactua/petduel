import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { photos, pets } from '../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Il proprietario può togliere una sua foto; un moderatore qualsiasi foto
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  const db = await useDb()
  const [row] = await db.select({ image: photos.image, ownerId: pets.ownerId })
    .from(photos).innerJoin(pets, eq(pets.id, photos.petId))
    .where(eq(photos.id, id))
  if (!row || (row.ownerId !== user.id && !(await isAdmin(user.id)))) {
    throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
  }

  await db.delete(photos).where(eq(photos.id, id))
  await removeImage(row.image)
  return { ok: true }
})
