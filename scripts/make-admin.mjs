// Promuove un utente a moderatore. Uso: npm run make-admin -- <username> [sito]
// Il sito è una cartella di sites/ (pets se manca): ognuno ha il suo database.
// Con PGlite (nessun DATABASE_URL) va lanciato a server fermo; con PostgreSQL anche a server acceso
import { openDb } from './db.mjs'

const username = process.argv[2]?.toLowerCase()
const site = process.argv[3] || 'pets'
if (!username) {
  console.error('Uso: npm run make-admin -- <username> [sito]')
  process.exit(1)
}

let db
try {
  db = await openDb(site)
}
catch (e) {
  console.error(e.message)
  process.exit(1)
}
const { rows } = await db.query('UPDATE users SET role = \'admin\' WHERE username = $1 RETURNING username', [username])
await db.close()

if (!rows.length) {
  console.error(`Nessun utente "${username}". Registrati prima dal sito.`)
  process.exit(1)
}
console.log(`${username} ora è moderatore. Ricarica il sito e apri "Admin" dal menu.`)
