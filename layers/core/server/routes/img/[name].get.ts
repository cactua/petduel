import { eq } from 'drizzle-orm'
import { photos, pets } from '../../db/schema'
import { parseImageName } from '#shared/images'

const CONTENT_TYPES = { webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml' } as const

// Foto approvate: pubbliche e in cache. In attesa: solo proprietario e moderatori.
// Oltre alla foto di base servono le varianti ritagliate (<id>-<ritaglio><larghezza>.<formato>).
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  const parsed = parseImageName(name)
  if (!parsed) throw createError({ statusCode: 404 })

  const db = await useDb()
  const [photo] = await db.select({ status: photos.status, ownerId: pets.ownerId })
    .from(photos).innerJoin(pets, eq(pets.id, photos.petId))
    .where(eq(photos.image, parsed.image))
  if (!photo || photo.status === 'rejected') throw createError({ statusCode: 404 })

  const isPublic = photo.status === 'approved'
  if (!isPublic) {
    const { user } = await getUserSession(event)
    if (!user || (user.id !== photo.ownerId && !(await isAdmin(user.id)))) throw createError({ statusCode: 404 })
  }

  const v = parsed.variant
  const data = v
    ? await ensureVariant(parsed.image, v.variant, v.width, v.format)
    : await useStorage('uploads').getItemRaw(parsed.image)
  if (!data) throw createError({ statusCode: 404 })

  const ext = v ? v.format : parsed.image.split('.').pop() as keyof typeof CONTENT_TYPES
  setResponseHeaders(event, {
    'content-type': CONTENT_TYPES[ext],
    // Il nome di un file non cambia mai contenuto: le approvate possono restare in cache a lungo
    'cache-control': isPublic ? 'public, max-age=604800' : 'private, no-store',
    'content-security-policy': 'default-src \'none\'; style-src \'unsafe-inline\'; sandbox',
  })
  return data
})
