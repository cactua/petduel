import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { favorites, pets } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.object({ saved: z.boolean() })

// Salva o toglie un partecipante dai preferiti. Nessuno lo sa, nemmeno il proprietario
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { saved } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()
  if (saved) {
    const [pet] = await db.select({ id: pets.id }).from(pets).where(and(eq(pets.id, id), hasApprovedPhoto))
    if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
    await db.insert(favorites).values({ userId: user.id, petId: id }).onConflictDoNothing()
  }
  else {
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.petId, id)))
  }
  return { saved }
})
