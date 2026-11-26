import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { photos, pets, users } from '../db/schema'

// Elenco delle foto pubbliche con autore e licenza (richiesto dalle licenze Creative Commons)
export default defineEventHandler(async () => {
  const db = await useDb()
  const rows = await db.select({ name: pets.name, petId: pets.id, owner: users.username, image: photos.image, credit: photos.credit, url: photos.creditUrl })
    .from(photos).innerJoin(pets, eq(pets.id, photos.petId)).innerJoin(users, eq(users.id, pets.ownerId))
    .where(and(eq(photos.status, 'approved'), isNotNull(photos.credit)))
    .orderBy(asc(pets.name))
  return rows.map(r => ({ petId: r.petId, name: r.name, owner: r.owner, image: imageUrl(r.image), credit: r.credit!, url: r.url }))
})
