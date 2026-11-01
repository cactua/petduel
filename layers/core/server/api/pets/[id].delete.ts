import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { photos, pets } from '../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Il proprietario (o un moderatore) elimina il pet: con lui spariscono foto, file, voti e iscrizioni alle sfide
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  const db = await useDb()
  const [pet] = await db.select({ ownerId: pets.ownerId }).from(pets).where(eq(pets.id, id))
  if (!pet || (pet.ownerId !== user.id && !(await isAdmin(user.id)))) {
    throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  }

  const images = await db.select({ image: photos.image }).from(photos).where(eq(photos.petId, id))
  // Le righe collegate (foto, voti, sfide, richieste di adozione) vanno via in cascata
  await db.delete(pets).where(eq(pets.id, id))
  await Promise.all(images.map(i => removeImage(i.image)))
  return { ok: true }
})
