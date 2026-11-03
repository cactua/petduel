import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { HAS_ARTISTS, type ArtistSettings } from '#shared/models'

// Impostazioni da artista di chi è collegato, per la pagina account
export default defineEventHandler(async (event): Promise<ArtistSettings> => {
  if (!HAS_ARTISTS) throw createError({ statusCode: 404 })
  const user = await requireUser(event)
  const db = await useDb()
  const [row] = await db.select({ isArtist: users.isArtist, links: users.artistLinks, commissions: users.commissions, commissionsUrl: users.commissionsUrl }).from(users).where(eq(users.id, user.id))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  return row
})
