import { eq } from 'drizzle-orm'
import { photos, users } from '../../db/schema'

// Il proprio avatar per menu e barra in basso (anche se l'immagine è ancora in revisione: lo vede solo chi lo possiede)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  const [row] = await db.select({ id: users.avatarImage, status: photos.status }).from(users)
    .leftJoin(photos, eq(photos.id, users.avatarPhotoId)).where(eq(users.id, user.id))
  return { id: row?.id && row.status && row.status !== 'rejected' ? row.id : null }
})
