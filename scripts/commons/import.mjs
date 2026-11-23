// Scarica le foto scelte in scripts/commons/<sito>.json e prepara i contenuti di esempio in sites/<sito>/server/assets/seed.
// Uso: node scripts/commons/import.mjs [sito]   (sito: pets, il predefinito, o moto)
// Poi cancella sites/<sito>/.data per ricreare il database con i nuovi esempi.
//
// Animali: ogni foto diventa la base verticale 3:4 (ritaglio sul soggetto), le altre forme si ricavano da quella.
// Moto: il soggetto è largo e un 3:4 lo taglierebbe, quindi si tiene la foto intera e si salvano i ritagli
// (verticale, orizzontale, quadrato) scelti in automatico sul soggetto. Una foto nel JSON può essere il titolo
// oppure { "title": "...", "crops": { "v": { "x": 0.2 } } } per correggere a mano una parte di un ritaglio.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { api, fetchBuffer, freeLicense, plainText, sleep } from './lib.mjs'

const sharp = createRequire(import.meta.url)('sharp')
const site = process.argv[2] || 'pets'
const WIDE = site === 'moto'
const root = new URL('../../', import.meta.url)
const outDir = new URL(`sites/${site}/server/assets/seed/`, root)
const list = JSON.parse(await readFile(new URL(`scripts/commons/${site}.json`, root), 'utf8'))

// Le stesse forme di layers/core/shared/images.ts
const RATIOS = { v: 3 / 4, h: 3 / 2, s: 1 }

/** Ritaglio più grande con quelle proporzioni, spostato sul soggetto (strategia "attention" di sharp), in frazioni */
async function autoCrop(buf, width, height, ratio) {
  const wide = width / height > ratio
  const w = wide ? Math.round(height * ratio) : width
  const h = wide ? height : Math.round(width / ratio)
  const { info } = await sharp(buf).resize(w, h, { fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true })
  const left = Math.abs(info.cropOffsetLeft ?? 0)
  const top = Math.abs(info.cropOffsetTop ?? 0)
  const r = n => Math.round(n * 10000) / 10000
  return { x: r(left / width), y: r(top / height), w: r(w / width), h: r(h / height) }
}

/** Ritaglio più grande con quelle proporzioni, al centro, in frazioni */
function centered(width, height, ratio) {
  const w = Math.min(1, (height * ratio) / width)
  const h = Math.min(1, width / ratio / height)
  const r = n => Math.round(n * 10000) / 10000
  return { x: r((1 - w) / 2), y: r((1 - h) / 2), w: r(w), h: r(h) }
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const pets = []
let n = 0
for (const pet of list) {
  const photos = []
  for (const entry of pet.photos) {
    const { title, crops: manual = {} } = typeof entry === 'string' ? { title: entry } : entry
    const data = await api({ titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: WIDE ? '1600' : '1200' })
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
    const target = fileURLToPath(new URL(file, outDir))
    const photo = { file, credit: `${author.slice(0, 120)} · ${license} · Wikimedia Commons`, url: info.descriptionurl }
    const source = await fetchBuffer(info.thumburl)
    if (WIDE) {
      // Foto intera (lato lungo al massimo 1440, la misura più grande delle varianti), WebP senza metadati; i ritagli li applica il sito al primo avvio
      const { data: buf, info: size } = await sharp(source).rotate().resize(1440, 1440, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 }).toBuffer({ resolveWithObject: true })
      await writeFile(target, buf)
      photo.crops = {}
      for (const [key, ratio] of Object.entries(RATIOS)) {
        // In verticale una moto vista di lato non ci sta: il centro (motore e serbatoio) si riconosce meglio
        // di quello che sceglie "attention", che spesso finisce su una ruota o sul codone
        const crop = key === 'v' ? centered(size.width, size.height, ratio) : await autoCrop(buf, size.width, size.height, ratio)
        photo.crops[key] = { ...crop, ...manual[key] }
      }
    }
    else {
      // Stesso trattamento degli upload: ritaglio 3:4 sul soggetto, WebP senza metadati
      await sharp(source)
        .rotate().resize(900, 1200, { fit: 'cover', position: sharp.strategy.attention })
        .webp({ quality: 82 }).toFile(target)
    }
    photos.push(photo)
    console.log(pet.name, '←', title)
    await sleep(1200)
  }
  if (photos.length) pets.push({ name: pet.name, species: pet.species, breed: pet.breed, city: pet.city, photos })
}

await writeFile(new URL('pets.json', outDir), JSON.stringify(pets, null, 2))
console.log(`${pets.length} esempi e ${n} foto in sites/${site}/server/assets/seed`)
