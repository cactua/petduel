import { photos, pets } from '../db/schema'
import { petFieldsSchema } from '#shared/models'

// Nuovo pet con la sua prima foto, che entra in coda di approvazione
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await assertPendingQuota(user.id)

  const { fields, image } = await readPhotoUpload(event)
  const parsed = petFieldsSchema.safeParse(fields)
  if (!parsed.success) {
    await removeImage(image)
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  }

  const db = await useDb()
  const pet = await db.transaction(async (tx) => {
    const [row] = await tx.insert(pets).values({ ...parsed.data, ownerId: user.id }).returning({ id: pets.id })
    await tx.insert(photos).values({ petId: row!.id, image })
    return row!
  })
  return { petId: pet.id }
})
