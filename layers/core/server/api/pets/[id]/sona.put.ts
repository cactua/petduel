import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { pets, photos } from '../../../db/schema'
import { HAS_SONA, sonaSheetSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Il proprietario compila la scheda del personaggio. La reference deve essere una sua immagine non rifiutata
export default defineEventHandler(async (event) => {
  if (!HAS_SONA) throw createError({ statusCode: 404 })
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = sonaSheetSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const db = await useDb()
  const sona = parsed.data
  if (sona.refPhotoId) {
    const [ref] = await db.select({ id: photos.id }).from(photos)
      .where(and(eq(photos.id, sona.refPhotoId), eq(photos.petId, id), ne(photos.status, 'rejected')))
    if (!ref) sona.refPhotoId = null
  }
  const [pet] = await db.update(pets).set({ sona })
    .where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
    .returning({ id: pets.id })
  if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  return { sona }
})
