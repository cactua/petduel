import { photos, pets, users } from '../db/schema'
import type { Species } from '#shared/models'
import type { Crops } from '#shared/images'
import site from '#site'
import type { Db } from './db'

interface SeedPet {
  name: string
  species: Species
  breed: string
  city: string
  /** crops: ritagli scelti sulla foto intera (siti con soggetti larghi, come le moto); senza, la foto è già la base 3:4 */
  photos: { file: string, credit: string, url: string, crops?: Crops }[]
}

// Contenuti di esempio del sito, in sites/<nome>/server/assets/seed (per PetDuel: foto libere di Wikimedia Commons
// preparate da scripts/commons/import.mjs). Un sito senza quella cartella parte vuoto
export async function seedPets(db: Db) {
  const assets = useStorage('assets:server')
  const list = await assets.getItem<SeedPet[]>('seed:pets.json')
  if (!list?.length) return

  // Account tecnico proprietario dei pet di esempio: l'hash "!" non corrisponde a nessuna password
  const [owner] = await db.insert(users)
    .values({ email: `esempi@${site.id}.local`, username: site.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20), passwordHash: '!' })
    .returning()

  const uploads = useStorage('uploads')
  for (const item of list) {
    const [pet] = await db.insert(pets)
      .values({ ownerId: owner!.id, name: item.name, species: item.species, breed: item.breed, city: item.city })
      .returning()
    for (const photo of item.photos) {
      const data = await assets.getItemRaw(`seed:${photo.file}`)
      if (!data) continue
      if (photo.crops) await writeSeedImage(photo.file, Buffer.from(data), photo.crops)
      else await uploads.setItemRaw(photo.file, Buffer.from(data))
      await db.insert(photos).values({ petId: pet!.id, image: photo.file, status: 'approved', credit: photo.credit, creditUrl: photo.url })
    }
  }
}
