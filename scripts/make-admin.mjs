// Promuove un utente a moderatore. Uso (a server fermo): npm run make-admin -- <username>
import { PGlite } from '@electric-sql/pglite'

const username = process.argv[2]?.toLowerCase()
if (!username) {
  console.error('Uso: npm run make-admin -- <username>')
  process.exit(1)
}

const db = new PGlite(process.env.PGLITE_DIR || './.data/pglite')
const { rows } = await db.query('UPDATE users SET role = \'admin\' WHERE username = $1 RETURNING username', [username])
await db.close()

if (!rows.length) {
  console.error(`Nessun utente "${username}". Registrati prima dal sito.`)
  process.exit(1)
}
console.log(`${username} ora è moderatore. Ricarica il sito e apri "Admin" dal menu.`)
