import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets } from '../../db/schema'
import { petFieldsSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Il proprietario corregge nome, specie, razza e città. Elo e vittorie restano quelli guadagnati.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = petFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const db = await useDb()
  const [pet] = await db.update(pets).set(parsed.data)
    .where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
    .returning({ id: pets.id })
  if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  return { ok: true }
})
