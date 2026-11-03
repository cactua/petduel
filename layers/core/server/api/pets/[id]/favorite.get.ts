import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { favorites } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// L'hai salvato tra i preferiti? Senza account no
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { user } = await getUserSession(event)
  if (!user) return { saved: false }
  const db = await useDb()
  const [row] = await db.select({ id: favorites.petId }).from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.petId, id)))
  return { saved: !!row }
})
