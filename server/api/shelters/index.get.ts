import { asc, eq } from 'drizzle-orm'
import { shelters } from '../../db/schema'
import type { PublicShelter } from '#shared/models'

// Rifugi verificati, in ordine alfabetico
export default defineEventHandler(async (): Promise<PublicShelter[]> => {
  const db = await useDb()
  const list = await db.select().from(shelters).where(eq(shelters.status, 'approved')).orderBy(asc(shelters.name))
  return toPublicShelters(list)
})
