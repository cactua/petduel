import { eq } from 'drizzle-orm'
import { shelters } from '@core/server/db/schema'
import { parseShelterImageName } from '#shared/images'

// Banner e logo dei rifugi: pubblici se il rifugio è verificato, altrimenti solo per chi lo gestisce
export default defineEventHandler(async (event) => {
  const parsed = parseShelterImageName(getRouterParam(event, 'name') ?? '')
  if (!parsed) throw createError({ statusCode: 404 })
  const db = await useDb()
  const [shelter] = await db.select({ status: shelters.status, userId: shelters.userId }).from(shelters)
    .where(eq(parsed.kind === 'banner' ? shelters.banner : shelters.logo, parsed.id))
  if (!shelter) throw createError({ statusCode: 404 })
  const isPublic = shelter.status === 'approved'
  if (!isPublic) {
    const { user } = await getUserSession(event)
    if (user?.id !== shelter.userId) throw createError({ statusCode: 404 })
  }
  const data = await useStorage('uploads').getItemRaw(getRouterParam(event, 'name')!)
  if (!data) throw createError({ statusCode: 404 })
  setResponseHeaders(event, {
    'content-type': `image/${parsed.format}`,
    'cache-control': isPublic ? 'public, max-age=604800' : 'private, no-store',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return data
})
