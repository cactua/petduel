import { and, eq } from 'drizzle-orm'
import { pets, photos, users } from '../../db/schema'
import { profileImageSchema } from '#shared/models'

// Avatar o banner del profilo: ritaglio di una propria immagine (anche in revisione: si vedrà dopo l'approvazione)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b => profileImageSchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  const { kind, photoId, crop } = body.data

  const db = await useDb()
  const [me] = await db.select({ avatar: users.avatarImage, banner: users.bannerImage }).from(users).where(eq(users.id, user.id))
  const old = me?.[kind] ?? null

  let id: string | null = null
  if (photoId) {
    if (!crop) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
    const [photo] = await db.select({ image: photos.image, status: photos.status }).from(photos).innerJoin(pets, eq(pets.id, photos.petId))
      .where(and(eq(photos.id, photoId), eq(pets.ownerId, user.id)))
    if (!photo || photo.status === 'rejected') throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
    id = await writeProfileImage(photo.image, kind, crop)
  }

  await db.update(users).set(kind === 'avatar'
    ? { avatarPhotoId: photoId, avatarImage: id, avatarCrop: photoId ? crop : null }
    : { bannerPhotoId: photoId, bannerImage: id, bannerCrop: photoId ? crop : null }).where(eq(users.id, user.id))
  await removeProfileImage(old, kind)
  return { ok: true }
})
