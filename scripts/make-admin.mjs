// Promuove un utente a moderatore. Uso (a server fermo): npm run make-admin -- <username> [sito]
// Il sito è una cartella di sites/ (pets se manca): ognuno ha il suo database
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const username = process.argv[2]?.toLowerCase()
const site = process.argv[3] || 'pets'
if (!username) {
  console.error('Uso: npm run make-admin -- <username> [sito]')
  process.exit(1)
}
const siteDir = fileURLToPath(new URL(`../sites/${site}/`, import.meta.url))
if (!existsSync(siteDir)) {
  console.error(`Nessun sito "${site}" in sites/.`)
  process.exit(1)
}

const db = new PGlite(process.env.PGLITE_DIR || `${siteDir}.data/pglite`)
const { rows } = await db.query('UPDATE users SET role = \'admin\' WHERE username = $1 RETURNING username', [username])
await db.close()

if (!rows.length) {
  console.error(`Nessun utente "${username}". Registrati prima dal sito.`)
  process.exit(1)
}
console.log(`${username} ora è moderatore. Ricarica il sito e apri "Admin" dal menu.`)
