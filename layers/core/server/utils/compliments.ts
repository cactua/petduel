import { and, eq, isNotNull } from 'drizzle-orm'
import { photos, pets } from '../db/schema'
import { useDb } from './db'

/** Proprietario e artisti indicati sulle immagini pubblicate di un partecipante: chi può leggere i complimenti */
export async function complimentReaders(petId: number) {
  const db = await useDb()
  const [pet] = await db.select({ ownerId: pets.ownerId, name: pets.name }).from(pets).where(eq(pets.id, petId))
  if (!pet) return null
  const artists = await db.selectDistinct({ id: photos.artistId }).from(photos)
    .where(and(eq(photos.petId, petId), eq(photos.status, 'approved'), isNotNull(photos.artistId)))
  return { ...pet, artistIds: artists.map(a => a.id!).filter(id => id !== pet.ownerId) }
}
