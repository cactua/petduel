import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { challengeEntries, photos, pets } from '../../../db/schema'

const idSchema = z.coerce.number().int().positive()
const jsonSchema = z.object({ petId: idSchema, photoId: idSchema })

/**
 * Iscrive un proprio pet alla sfida in corso, in due modi:
 * - JSON { petId, photoId }: con una foto già approvata della sua gallery;
 * - multipart { petId, photo }: con una foto nuova, che finisce anche in gallery e passa dalla moderazione.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const challenge = await getChallenge(getRouterParam(event, 'slug') ?? '')
  if (challengeStatus(challenge) !== 'active') throw createError({ statusCode: 409, statusMessage: 'errors.joinOnlyActive' })

  const db = await useDb()
  const checkPet = async (petId: number) => {
    const [pet] = await db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.ownerId, user.id)))
    if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
    if (challenge.species && pet.species !== challenge.species) {
      throw createError({ statusCode: 400, statusMessage: 'errors.wrongSpecies' })
    }
    if (pet.hideFromRankings) {
      throw createError({ statusCode: 400, statusMessage: 'errors.petHidden' })
    }
    if (challenge.adoptionOnly && pet.adoption !== 'available' && pet.adoption !== 'fostered') {
      throw createError({ statusCode: 400, statusMessage: 'errors.adoptionOnly' })
    }
    const [already] = await db.select({ id: challengeEntries.id }).from(challengeEntries)
      .where(and(eq(challengeEntries.challengeId, challenge.id), eq(challengeEntries.petId, petId)))
    if (already) throw createError({ statusCode: 409, statusMessage: 'errors.alreadyEntered' })
    return pet
  }

  let petId: number
  let photoId: number

  if (getRequestHeader(event, 'content-type')?.startsWith('multipart/form-data')) {
    await assertPendingQuota(user.id)
    const { fields, image } = await readPhotoUpload(event)
    try {
      petId = idSchema.parse(fields.petId)
      await checkPet(petId)
    }
    catch (e) {
      await removeImage(image)
      throw e instanceof z.ZodError ? createError({ statusCode: 400, statusMessage: 'errors.pickPet' }) : e
    }
    const [photo] = await db.insert(photos).values({ petId, image }).returning({ id: photos.id })
    photoId = photo!.id
  }
  else {
    const body = await readValidatedBody(event, jsonSchema.parse)
    await checkPet(body.petId)
    const [photo] = await db.select({ id: photos.id }).from(photos)
      .where(and(eq(photos.id, body.photoId), eq(photos.petId, body.petId), eq(photos.status, 'approved')))
    if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
    petId = body.petId
    photoId = photo.id
  }

  const [entry] = await db.insert(challengeEntries)
    .values({ challengeId: challenge.id, petId, photoId })
    .onConflictDoNothing()
    .returning({ id: challengeEntries.id })
  if (!entry) throw createError({ statusCode: 409, statusMessage: 'errors.alreadyEntered' })
  return { entryId: entry.id }
})
