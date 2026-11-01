import { eq } from 'drizzle-orm'
import { pets, shelters } from '../../db/schema'

// Ritira la richiesta di verifica o chiude il rifugio: i pet restano, ma tornano pet normali
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  const [removed] = await db.delete(shelters).where(eq(shelters.userId, user.id)).returning({ logo: shelters.logo, banner: shelters.banner })
  if (!removed) throw createError({ statusCode: 404, statusMessage: 'errors.noShelter' })
  await Promise.all([removeShelterImage(removed.logo, 'logo'), removeShelterImage(removed.banner, 'banner')])
  await db.update(pets).set({ adoption: null, hideFromRankings: false }).where(eq(pets.ownerId, user.id))
  return { ok: true }
})
