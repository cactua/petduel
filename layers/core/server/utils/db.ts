import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { HAS_BREED_CITY, type PublicPet } from '#shared/models'
import { seedPets } from './seed'

// PGlite = PostgreSQL in-process, niente da installare in sviluppo.
// In produzione si passa a drizzle-orm/node-postgres con lo stesso schema.
const dataDir = process.env.PGLITE_DIR || './.data/pglite'
mkdirSync(dataDir, { recursive: true })
const client = new PGlite(dataDir)
const db = drizzle(client, { schema })

export type Db = typeof db

let ready: Promise<void> | undefined

export async function useDb() {
  ready ??= (async () => {
    await client.exec(schema.CREATE_TABLES_SQL)
    // Sui siti senza razza e città (furry) i due campi restano vuoti anche per i pet salvati prima che si spegnessero,
    // altrimenti un vecchio valore ("gatto") ricompare nelle card e nelle classifiche
    if (!HAS_BREED_CITY) await client.exec(`update pets set breed = '', city = '' where breed <> '' or city <> ''`)
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.pets)
    if (!row?.count) await seedPets(db)
  })()
  await ready
  return db
}

export const imageUrl = (image: string) => `/img/${image}`

export const photoCredit = (text: string | null, url: string | null) => (text ? { text, url } : null)

export function toPublicPet(pet: schema.Pet, image: string, owner: string, credit: PublicPet['credit'] = null): PublicPet {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    city: pet.city,
    image: imageUrl(image),
    credit,
    owner,
    adoption: pet.adoption,
  }
}
