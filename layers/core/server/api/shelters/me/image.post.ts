import { eq } from 'drizzle-orm'
import { shelters } from '../../../db/schema'

// Nuovo banner o logo: sostituisce subito quello di prima
export default defineEventHandler(async (event) => {
  const { shelter } = await requireShelter(event)
  const { id, kind } = await readShelterImage(event)
  const db = await useDb()
  await db.update(shelters).set({ [kind]: id }).where(eq(shelters.id, shelter.id))
  await removeShelterImage(shelter[kind], kind)
  return { id }
})
