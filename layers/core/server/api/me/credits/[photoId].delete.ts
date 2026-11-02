import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { photos } from '../../../db/schema'
import { HAS_ARTISTS } from '#shared/models'

const paramsSchema = z.object({ photoId: z.coerce.number().int().positive() })

// L'artista toglie il suo nome da un'immagine caricata da altri ("non sono io"): l'immagine resta, senza artista
export default defineEventHandler(async (event) => {
  if (!HAS_ARTISTS) throw createError({ statusCode: 404 })
  const user = await requireUser(event)
  const { photoId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [photo] = await db.update(photos).set({ credit: null, creditUrl: null, artistId: null })
    .where(and(eq(photos.id, photoId), eq(photos.artistId, user.id))).returning({ id: photos.id })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
  return { ok: true }
})
