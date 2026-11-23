import { eq } from 'drizzle-orm'
import { photos, users } from '../../db/schema'
import { parseProfileImageName } from '#shared/images'

// Avatar e banner: pubblici se l'immagine di partenza è approvata, altrimenti solo per il proprietario
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  const parsed = parseProfileImageName(name)
  if (!parsed) throw createError({ statusCode: 404 })
  const db = await useDb()
  const photoCol = parsed.kind === 'avatar' ? users.avatarPhotoId : users.bannerPhotoId
  const [row] = await db.select({ userId: users.id, status: photos.status }).from(users)
    .innerJoin(photos, eq(photos.id, photoCol))
    .where(eq(parsed.kind === 'avatar' ? users.avatarImage : users.bannerImage, parsed.id))
  if (!row || row.status === 'rejected') throw createError({ statusCode: 404 })
  const isPublic = row.status === 'approved'
  if (!isPublic) {
    const user = await optionalUser(event)
    if (user?.id !== row.userId) throw createError({ statusCode: 404 })
  }
  const data = await useStorage('uploads').getItemRaw(name)
  if (!data) throw createError({ statusCode: 404 })
  setResponseHeaders(event, {
    'content-type': `image/${parsed.format}`,
    'cache-control': isPublic ? 'public, max-age=604800' : 'private, no-store',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return data
})
