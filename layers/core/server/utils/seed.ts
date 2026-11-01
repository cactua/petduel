import { photos, pets, users } from '../db/schema'
import type { Species } from '#shared/models'
import type { Db } from './db'

interface SeedPet {
  name: string
  species: Species
  breed: string
  city: string
  photos: { file: string, credit: string, url: string }[]
}

// Contenuti di esempio del sito, in sites/<nome>/server/assets/seed (per PetDuel: foto libere di Wikimedia Commons
// preparate da scripts/commons/import.mjs). Un sito senza quella cartella parte vuoto
export async function seedPets(db: Db) {
  const assets = useStorage('assets:server')
  const list = await assets.getItem<SeedPet[]>('seed:pets.json')
  if (!list?.length) return

  // Account tecnico proprietario dei pet di esempio: l'hash "!" non corrisponde a nessuna password
  const [owner] = await db.insert(users)
    .values({ email: 'esempi@petduel.local', username: 'petduel', passwordHash: '!' })
    .returning()

  const uploads = useStorage('uploads')
  for (const item of list) {
    const [pet] = await db.insert(pets)
      .values({ ownerId: owner!.id, name: item.name, species: item.species, breed: item.breed, city: item.city })
      .returning()
    for (const photo of item.photos) {
      const data = await assets.getItemRaw(`seed:${photo.file}`)
      if (!data) continue
      await uploads.setItemRaw(photo.file, Buffer.from(data))
      await db.insert(photos).values({ petId: pet!.id, image: photo.file, status: 'approved', credit: photo.credit, creditUrl: photo.url })
    }
  }
}
