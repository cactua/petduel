import { and, eq, isNotNull } from 'drizzle-orm'
import { pets, shelters, users } from '@core/server/db/schema'
import type { ShelterPage } from '#shared/models'

// Pagina pubblica del rifugio: presentazione e pet con una scheda di adozione
export default defineEventHandler(async (event): Promise<ShelterPage> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const db = await useDb()
  const [row] = await db.select({ shelter: shelters, owner: users.username }).from(shelters)
    .innerJoin(users, eq(users.id, shelters.userId))
    .where(and(eq(shelters.slug, slug), eq(shelters.status, 'approved')))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.shelterNotFound' })

  const [[pub], galleries] = await Promise.all([
    toPublicShelters([row.shelter]),
    loadGalleries(and(eq(pets.ownerId, row.shelter.userId), isNotNull(pets.adoption)), false),
  ])
  // I contatti privati (per i moderatori) restano fuori
  const { contactEmail: _email, phone: _phone, socials, ...profile } = shelterProfile(row.shelter)
  return {
    ...pub!,
    ...profile,
    socials: Object.fromEntries(Object.entries(socials).filter(([, v]) => v)),
    owner: row.owner,
    pets: galleries,
  }
})
