import { asc, eq } from 'drizzle-orm'
import { shelters, users } from '../../db/schema'
import type { ShelterReviewItem } from '#shared/models'

// Rifugi da verificare (i più vecchi per primi) e rifugi già verificati (per nome)
export default defineEventHandler(async (event): Promise<{ pending: ShelterReviewItem[], approved: ShelterReviewItem[] }> => {
  await requireAdmin(event)
  const db = await useDb()
  const rows = await db.select({ s: shelters, owner: users.username }).from(shelters)
    .innerJoin(users, eq(users.id, shelters.userId))
    .orderBy(asc(shelters.createdAt))
  const item = ({ s, owner }: (typeof rows)[number]): ShelterReviewItem => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city,
    description: s.description,
    website: s.website,
    taxCode: s.taxCode,
    contactEmail: s.contactEmail,
    phone: s.phone,
    owner,
    createdAt: s.createdAt.toISOString(),
  })
  return {
    pending: rows.filter(r => r.s.status === 'pending').map(item),
    approved: rows.filter(r => r.s.status === 'approved').map(item).sort((a, b) => a.name.localeCompare(b.name, 'it')),
  }
})
