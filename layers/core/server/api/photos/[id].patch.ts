import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { photos, pets } from '../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.object({ inDuels: z.boolean() })

// Il proprietario sceglie se usare una sua immagine nei duelli (le altre restano nel profilo)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, b => bodySchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })

  const db = await useDb()
  const [row] = await db.select({ ownerId: pets.ownerId }).from(photos).innerJoin(pets, eq(pets.id, photos.petId)).where(eq(photos.id, id))
  if (!row || row.ownerId !== user.id) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
  await db.update(photos).set({ inDuels: body.data.inDuels }).where(eq(photos.id, id))
  return { inDuels: body.data.inDuels }
})
