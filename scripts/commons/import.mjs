// Scarica le foto scelte in scripts/commons/pets.json e prepara i pet di esempio in sites/pets/server/assets/seed.
// Uso: node scripts/commons/import.mjs   (poi cancella .data per ricreare il database con i nuovi esempi)
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { api, fetchBuffer, freeLicense, plainText, sleep } from './lib.mjs'

const sharp = createRequire(import.meta.url)('sharp')
const root = new URL('../../', import.meta.url)
const outDir = new URL('sites/pets/server/assets/seed/', root)
const list = JSON.parse(await readFile(new URL('scripts/commons/pets.json', root), 'utf8'))

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const pets = []
let n = 0
for (const pet of list) {
  const photos = []
  for (const title of pet.photos) {
    const data = await api({ titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1200' })
    const info = Object.values(data.query.pages)[0]?.imageinfo?.[0]
    if (!info) {
      console.warn('Non trovata:', title)
      continue
    }
    const meta = info.extmetadata ?? {}
    const license = plainText(meta.LicenseShortName?.value)
    if (!freeLicense(license)) {
      console.warn('Licenza non adatta, salto:', title, license)
      continue
    }
    const author = plainText(meta.Artist?.value) || 'Autore sconosciuto'
    const file = `commons-${++n}.webp`
    // Stesso trattamento degli upload: ritaglio 3:4 sul soggetto, WebP senza metadati
    await sharp(await fetchBuffer(info.thumburl))
      .rotate().resize(900, 1200, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 82 }).toFile(fileURLToPath(new URL(file, outDir)))
    photos.push({ file, credit: `${author.slice(0, 120)} · ${license} · Wikimedia Commons`, url: info.descriptionurl })
    console.log(pet.name, '←', title)
    await sleep(1200)
  }
  if (photos.length) pets.push({ name: pet.name, species: pet.species, breed: pet.breed, city: pet.city, photos })
}

await writeFile(new URL('pets.json', outDir), JSON.stringify(pets, null, 2))
console.log(`${pets.length} pet e ${n} foto in sites/pets/server/assets/seed`)
