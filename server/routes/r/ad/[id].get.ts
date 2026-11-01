import { eq } from 'drizzle-orm'
import { adEvents, ads } from '../../../db/schema'

// Clic su un annuncio: si conta e si va al sito dell'inserzionista con i parametri UTM
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 404 })
  const db = await useDb()
  const [ad] = await db.select().from(ads).where(eq(ads.id, id))
  if (!ad) throw createError({ statusCode: 404 })
  const { voterId, user } = await getUserSession(event)
  await db.insert(adEvents).values({ adId: id, type: 'click', voterId: user ? `u:${user.id}` : voterId ?? 'anonimo', ...adEventPlace(event) })
  setResponseHeader(event, 'cache-control', 'no-store')
  // Il link può cambiare con la lingua di chi clicca
  return sendRedirect(event, withUtm(adLocalized(ad, visitorLang(event)).url, ad), 302)
})
