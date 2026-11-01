import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets } from '../../../db/schema'
import { adoptionFieldsSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Scheda di adozione di un pet del rifugio: stato (null la toglie) e dati utili a chi adotta
export default defineEventHandler(async (event) => {
  const { user } = await requireShelter(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = adoptionFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const db = await useDb()
  const { status, ...fields } = parsed.data
  // Senza scheda di adozione l'opzione non ha senso: il pet torna in gara
  const [pet] = await db.update(pets).set({ adoption: status, ...fields, hideFromRankings: status !== null && fields.hideFromRankings })
    .where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
    .returning({ id: pets.id })
  if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  return { ok: true }
})
