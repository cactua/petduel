// Una tantum, per il passaggio agli indirizzi in inglese. Va lanciato a server spento, su ogni sito:
// - le sfide automatiche prendono lo slug inglese del tema (dormiglione-2026-10-26 -> sleepyhead-2026-10-26)
// - i link delle notifiche già salvate puntano alle pagine nuove (/classifica/gatti -> /leaderboard/cats)
// Uso: node scripts/migrate-challenge-slugs.mjs sites/pets/.data/pglite
import { PGlite } from '@electric-sql/pglite'

const THEMES = {
  'dormiglione': 'sleepyhead', 'linguaccia': 'tongue-out', 'agguato': 'pounce', 'scatola': 'box-king',
  'faccia-colpevole': 'guilty-face', 'riporto': 'fetch', 'sguardo': 'the-look', 'migliori-amici': 'best-friends',
  'esploratore': 'explorer', 'musetto-goloso': 'foodie', 'pose-impossibili': 'impossible-poses', 'bagnetto': 'bath-time',
}
const CATEGORIES = {
  cani: 'dogs', gatti: 'cats', conigli: 'rabbits', roditori: 'rodents', uccelli: 'birds', rettili: 'reptiles', altri: 'others',
}
const PATHS = { '/classifica': '/leaderboard', '/sfide': '/challenges', '/seguiti': '/following', '/preferiti': '/favorites', '/votati': '/voted' }

function englishLink(link) {
  let [path, query = ''] = link.split('?')
  for (const [from, to] of Object.entries(PATHS)) {
    if (path === from || path.startsWith(`${from}/`)) path = to + path.slice(from.length)
  }
  path = path.replace(/^\/leaderboard\/([a-z]+)/, (m, c) => (CATEGORIES[c] ? `/leaderboard/${CATEGORIES[c]}` : m))
  path = path.replace(/^\/challenges\/([a-z-]+?)(-\d{4}-\d{2}-\d{2})$/, (m, t, d) => (THEMES[t] ? `/challenges/${THEMES[t]}${d}` : m))
  query = query.replace(/\bsfida=([a-z-]+?)(-\d{4}-\d{2}-\d{2})\b/, (m, t, d) => `challenge=${THEMES[t] ?? t}${d}`)
    .replace(/\bsfida=/, 'challenge=').replace(/\bcondividi=/, 'share=').replace(/\bperiodo=sempre\b/, 'period=all')
  return query ? `${path}?${query}` : path
}

const db = new PGlite(process.argv[2] ?? 'sites/pets/.data/pglite')
let slugs = 0
for (const [from, to] of Object.entries(THEMES)) {
  const res = await db.query(
    `update challenges set slug = $2 || substr(slug, length($1) + 1) where slug ~ ('^' || $1 || '-\\d{4}-\\d{2}-\\d{2}$')`,
    [from, to],
  )
  slugs += res.affectedRows ?? 0
}
let links = 0
for (const { link } of (await db.query(`select distinct link from notifications where link is not null`)).rows) {
  const next = englishLink(link)
  if (next === link) continue
  const res = await db.query(`update notifications set link = $2 where link = $1`, [link, next])
  links += res.affectedRows ?? 0
}
console.log(`${slugs} sfide e ${links} notifiche aggiornate`)
await db.close()
