// ads.txt: dichiara a Google che questo sito vende i suoi spazi tramite il nostro account AdSense.
// Si aggiorna da solo quando l'admin inserisce il codice editore
export default defineEventHandler(async (event) => {
  const { network } = await getAdSettings()
  if (!network.client) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `google.com, ${network.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
})
