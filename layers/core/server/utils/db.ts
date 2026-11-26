import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import * as schema from '../db/schema'
import { HAS_BREED_CITY, type PublicPet } from '#shared/models'
import { seedPets } from './seed'

// Due modi, stesso schema e stesse query:
// - DATABASE_URL nel file .env (o nell'ambiente del server): PostgreSQL vero, per la produzione e per più server insieme
// - senza: PGlite, PostgreSQL dentro il processo, niente da installare in sviluppo (un processo alla volta)
const url = process.env.DATABASE_URL
let exec: (query: string) => Promise<unknown>
let db: ReturnType<typeof drizzlePglite<typeof schema>>

if (url) {
  // Connessioni condivise; "sslmode=require" nell'indirizzo per i database gestiti (Neon, Supabase, Render...)
  const pool = new pg.Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX) || 10 })
  pool.on('error', e => console.error('[db] connessione persa', e.message))
  // I due driver hanno gli stessi metodi (select, insert, execute → { rows }): il tipo è quello di PGlite
  db = drizzlePg(pool, { schema }) as unknown as typeof db
  exec = async (query) => {
    // Più server che partono insieme: le tabelle le crea uno alla volta
    const client = await pool.connect()
    try {
      await client.query('select pg_advisory_lock(727274)')
      await client.query(query)
    }
    finally {
      await client.query('select pg_advisory_unlock(727274)').catch(() => {})
      client.release()
    }
  }
}
else {
  const dataDir = process.env.PGLITE_DIR || './.data/pglite'
  mkdirSync(dataDir, { recursive: true })
  const client = new PGlite(dataDir)
  db = drizzlePglite(client, { schema })
  exec = query => client.exec(query)
}

export type Db = typeof db

let ready: Promise<void> | undefined

async function prepare() {
  await exec(schema.CREATE_TABLES_SQL)
  // Sui siti senza razza e città (furry) i due campi restano vuoti anche per i pet salvati prima che si spegnessero,
  // altrimenti un vecchio valore ("Persiano") ricompare nelle card e nelle classifiche
  if (!HAS_BREED_CITY) await exec(`update pets set breed = '', city = '' where breed <> '' or city <> ''`)
  // I partecipanti di esempio solo in sviluppo: con un database vero servono SEED_DEMO=1
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.pets)
  if (!row?.count && (!url || process.env.SEED_DEMO === '1')) await seedPets(db)
}

export async function useDb() {
  // Se la preparazione fallisce (database irraggiungibile) la richiesta dopo riprova
  ready ??= prepare().catch((e) => {
    ready = undefined
    throw e
  })
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
