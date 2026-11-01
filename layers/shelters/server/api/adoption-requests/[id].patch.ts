import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { adoptionRequests } from '@core/server/db/schema'
import { REQUEST_STATUS } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.object({ status: z.enum(REQUEST_STATUS) })

// Il rifugio segna una richiesta come contattata o chiusa
export default defineEventHandler(async (event) => {
  const { shelter } = await requireShelter(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { status } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()
  const [row] = await db.update(adoptionRequests).set({ status })
    .where(and(eq(adoptionRequests.id, id), eq(adoptionRequests.shelterId, shelter.id)))
    .returning({ id: adoptionRequests.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.requestNotFound' })
  return { ok: true }
})
