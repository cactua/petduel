// Copia le immagini di un sito da .data/uploads al suo bucket R2 (chiavi R2_* nel .env del sito).
// Uso: npm run upload-to-r2 -- [sito]   (pets se manca). Salta i file già presenti, quindi si può rilanciare
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import s3Driver from 'unstorage/drivers/s3'

const site = process.argv[2] || 'pets'
const siteDir = fileURLToPath(new URL(`../sites/${site}/`, import.meta.url))
if (!existsSync(siteDir)) {
  console.error(`Nessun sito "${site}" in sites/.`)
  process.exit(1)
}
if (existsSync(join(siteDir, '.env'))) process.loadEnvFile(join(siteDir, '.env'))

const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error(`Nel .env di ${site} mancano R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY.`)
  process.exit(1)
}
const r2 = s3Driver({ endpoint: R2_ENDPOINT, bucket: R2_BUCKET, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, region: 'auto' })

const root = join(siteDir, '.data', 'uploads')
const files = existsSync(root)
  ? readdirSync(root, { recursive: true, withFileTypes: true }).filter(f => f.isFile()).map(f => join(f.parentPath, f.name))
  : []

let copied = 0
let skipped = 0
// Pochi alla volta, per non aprire centinaia di connessioni insieme
const queue = [...files]
async function worker() {
  for (let file = queue.shift(); file; file = queue.shift()) {
    const key = relative(root, file).split(sep).join('/')
    if (await r2.hasItem(key)) {
      skipped++
      continue
    }
    await r2.setItemRaw(key, readFileSync(file))
    copied++
    if (copied % 50 === 0) console.log(`${copied} copiati…`)
  }
}
await Promise.all(Array.from({ length: 8 }, worker))
console.log(`${site}: ${copied} file copiati su "${R2_BUCKET}", ${skipped} già presenti (${files.length} in tutto).`)
