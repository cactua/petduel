import s3Driver from 'unstorage/drivers/s3'

// Immagini su Cloudflare R2 se nel .env del sito ci sono le sue quattro chiavi, altrimenti restano su disco
// (.data/uploads, vedi nuxt.config.ts). I nomi non cambiano: "ads:foo.webp" diventa ads/foo.webp nel bucket,
// come le cartelle su disco, quindi scripts/upload-to-r2.mjs può copiarle così come sono.
// Si servono sempre dalle rotte del sito (/img…), mai dal bucket: le foto in attesa restano private
export default defineNitroPlugin(() => {
  const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return

  const r2 = s3Driver({
    endpoint: R2_ENDPOINT,
    bucket: R2_BUCKET,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    region: 'auto',
  })
  const storage = useStorage()
  // Senza "dispose" lo scambio è immediato: avviene prima della prima richiesta
  void storage.unmount('uploads', false)
  storage.mount('uploads', {
    ...r2,
    // Come il driver su disco: Buffer invece di ArrayBuffer, così sharp e le risposte restano uguali
    getItemRaw: async (key, opts) => {
      const data = await r2.getItemRaw!(key, opts) as ArrayBuffer | null
      return data ? Buffer.from(data) : null
    },
  })
  console.info(`Immagini su R2, bucket "${R2_BUCKET}"`)
})
