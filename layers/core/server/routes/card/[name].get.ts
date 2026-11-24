import { z } from 'zod'

const querySchema = z.object({
  format: z.enum(['story', 'og']).catch('story'),
  // Una sfida sconosciuta o malformata non blocca la card: si ignora
  challenge: z.string().regex(/^[a-z0-9-]{1,80}$/).optional().catch(undefined),
})

// /card/<id>.png?format=story|og&challenge=<slug>: immagine da condividere, solo per pet pubblici
// /card/site.png: anteprima della home e delle pagine senza un'immagine propria
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  const match = /^(\d{1,9})\.png$/.exec(name)
  if (!match && name !== 'site.png') throw createError({ statusCode: 404 })
  const host = getRequestURL(event).host

  let png: Buffer
  if (match) {
    const { format, challenge } = await getValidatedQuery(event, querySchema.parse)
    png = await renderPetCard(Number(match[1]), format, host, challenge)
  }
  else png = await renderSiteCard(host)
  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=600',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return png
})
