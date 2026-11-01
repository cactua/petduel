// Cerca foto di animali domestici con licenza libera su Wikimedia Commons e crea dei provini da rivedere a mano.
// Uso: node scripts/commons/discover.mjs <cartella-output>
// Le foto scelte vanno poi copiate in scripts/commons/pets.json (vedi import.mjs).
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { api, fetchBuffer, freeLicense, plainText, sleep } from './lib.mjs'

const sharp = createRequire(import.meta.url)('sharp')
const out = process.argv[2]
if (!out) {
  console.error('Uso: node scripts/commons/discover.mjs <cartella-output>')
  process.exit(1)
}

const QUERIES = {
  cane: ['dog portrait incategory:Quality_images', 'puppy incategory:Quality_images'],
  gatto: ['cat portrait incategory:Quality_images', 'kitten incategory:Quality_images'],
  coniglio: ['domestic rabbit', 'pet rabbit', 'dwarf rabbit'],
  roditore: ['guinea pig pet', 'Syrian hamster', 'pet chinchilla', 'pet rat'],
  uccello: ['budgerigar pet', 'cockatiel pet', 'pet canary', 'Agapornis pet'],
  rettile: ['leopard gecko', 'Pogona vitticeps pet', 'Testudo hermanni', 'corn snake pet'],
  altro: ['pet ferret', 'African pygmy hedgehog', 'pet pony'],
}

// Niente zoo, animali selvatici, persone in primo piano o disegni
const EXCLUDE = /wild|zoo|tierpark|vogelpark|wildlife|girl|boy|\bman\b|woman|people|child|wolf|fox|dhole|cricetus|skull|museum|statue|drawing|illustration|stamp|sculpture|dead|meat|market|map/i

const candidates = {}
for (const [species, queries] of Object.entries(QUERIES)) {
  const seen = new Map()
  for (const q of queries) {
    const data = await api({
      generator: 'search', gsrnamespace: '6', gsrlimit: '40', gsrsearch: `${q} filetype:bitmap`,
      prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '300',
    })
    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0]
      if (!info || seen.has(page.title) || EXCLUDE.test(page.title)) continue
      const meta = info.extmetadata ?? {}
      const license = plainText(meta.LicenseShortName?.value)
      const ratio = info.width / info.height
      if (!freeLicense(license) || info.width < 800 || info.height < 700 || ratio < 0.55 || ratio > 1.7) continue
      if (!/jpeg|png/.test(info.mime)) continue
      seen.set(page.title, {
        title: page.title,
        thumb: info.thumburl,
        author: plainText(meta.Artist?.value) || 'Autore sconosciuto',
        license,
        source: info.descriptionurl,
      })
    }
    await sleep(1500)
  }
  candidates[species] = [...seen.values()].slice(0, 36)
  console.log(species, candidates[species].length)
}

await mkdir(out, { recursive: true })
await writeFile(`${out}/candidates.json`, JSON.stringify(candidates, null, 2))

// Un provino per specie: miniature numerate, per scegliere a colpo d'occhio
const W = 200, H = 260, COLS = 6
for (const [species, list] of Object.entries(candidates)) {
  const tiles = []
  for (const [i, c] of list.entries()) {
    try {
      const img = await sharp(await fetchBuffer(c.thumb)).resize(W, H, { fit: 'cover' }).toBuffer()
      const label = Buffer.from(`<svg width="${W}" height="${H}"><rect width="44" height="30" fill="#000" opacity=".7"/><text x="8" y="22" font-size="20" font-family="Arial" fill="#fff">${i}</text></svg>`)
      tiles.push({ input: await sharp(img).composite([{ input: label }]).toBuffer(), left: (i % COLS) * W, top: Math.floor(i / COLS) * H })
    }
    catch (e) {
      console.warn('miniatura saltata', c.title, e.message)
    }
    await sleep(400)
  }
  const rows = Math.max(1, Math.ceil(list.length / COLS))
  await sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: '#222' } })
    .composite(tiles).jpeg({ quality: 80 }).toFile(`${out}/${species}.jpg`)
}
console.log('Provini pronti in', out)
