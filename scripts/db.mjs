// Apre il database di un sito per gli script: PostgreSQL se c'è DATABASE_URL (nell'ambiente o nel .env del sito),
// altrimenti la cartella PGlite del sito (da usare a server spento: PGlite regge un processo alla volta)
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function siteDir(site) {
  const dir = fileURLToPath(new URL(`../sites/${site}/`, import.meta.url))
  if (!existsSync(dir)) throw new Error(`Nessun sito "${site}" in sites/.`)
  return dir
}

/** DATABASE_URL dall'ambiente o dal file .env del sito (senza stamparlo: contiene la password) */
export function databaseUrl(site) {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const env = `${siteDir(site)}.env`
  if (!existsSync(env)) return undefined
  const line = readFileSync(env, 'utf8').split(/\r?\n/).find(l => /^\s*DATABASE_URL\s*=/.test(l))
  return line?.replace(/^\s*DATABASE_URL\s*=\s*/, '').replace(/^["']|["']$/g, '').trim() || undefined
}

export const pgliteDir = site => process.env.PGLITE_DIR || `${siteDir(site)}.data/pglite`

/** { kind, query(text, params) → { rows }, close() } */
export async function openDb(site, { forcePglite = false } = {}) {
  const url = forcePglite ? undefined : databaseUrl(site)
  if (url) {
    const { default: pg } = await import('pg')
    const client = new pg.Client({ connectionString: url })
    await client.connect()
    return { kind: 'postgres', query: (text, params) => client.query(text, params), close: () => client.end() }
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(pgliteDir(site))
  return { kind: 'pglite', query: (text, params) => db.query(text, params), exec: text => db.exec(text), close: () => db.close() }
}
