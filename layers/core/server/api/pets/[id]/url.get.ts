import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets, users } from '../../../db/schema'
import { entryUrl } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Indirizzo con il nome per un vecchio link con il numero (/pet/<id>, /character/<id>, link negli avvisi)
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [row] = await db.select({ name: pets.name, owner: users.username }).from(pets)
    .innerJoin(users, eq(users.id, pets.ownerId)).where(eq(pets.id, id))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  return { url: entryUrl(row) }
})
