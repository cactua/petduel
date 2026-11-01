import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { shelters } from '@core/server/db/schema'
import { SHELTER_IMAGE_KINDS } from '#shared/images'

export default defineEventHandler(async (event) => {
  const { shelter } = await requireShelter(event)
  const { kind } = await getValidatedQuery(event, z.object({ kind: z.enum(SHELTER_IMAGE_KINDS) }).parse)
  const db = await useDb()
  await db.update(shelters).set({ [kind]: null }).where(eq(shelters.id, shelter.id))
  await removeShelterImage(shelter[kind], kind)
  return { ok: true }
})
