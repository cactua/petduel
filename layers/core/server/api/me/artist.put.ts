import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { HAS_ARTISTS, artistSettingsSchema } from '#shared/models'

// Segna il proprio profilo come artista (o lo toglie) e salva le pagine social.
// Togliendolo i disegni già attribuiti restano attribuiti: chi carica non lo può più scegliere
export default defineEventHandler(async (event) => {
  if (!HAS_ARTISTS) throw createError({ statusCode: 404 })
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b => artistSettingsSchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: body.error.issues[0]?.message ?? 'validation.check' })
  // Senza doppioni, nell'ordine scelto
  const links = [...new Set(body.data.links)]
  const db = await useDb()
  // Senza link le commissioni aperte non servono a niente: resta solo lo stato
  const { isArtist, commissions, commissionsUrl } = body.data
  await db.update(users).set({ isArtist, artistLinks: links, commissions, commissionsUrl }).where(eq(users.id, user.id))
  return { isArtist, links, commissions, commissionsUrl }
})
