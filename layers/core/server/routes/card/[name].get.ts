import { z } from 'zod'

const querySchema = z.object({
  format: z.enum(['story', 'og']).catch('story'),
  // Una sfida sconosciuta o malformata non blocca la card: si ignora
  challenge: z.string().regex(/^[a-z0-9-]{1,80}$/).optional().catch(undefined),
})

// /card/<id>.png?format=story|og&challenge=<slug>: immagine da condividere, solo per pet pubblici
export default defineEventHandler(async (event) => {
  const match = /^(\d{1,9})\.png$/.exec(getRouterParam(event, 'name') ?? '')
  if (!match) throw createError({ statusCode: 404 })
  const { format, challenge } = await getValidatedQuery(event, querySchema.parse)

  const png = await renderPetCard(Number(match[1]), format, getRequestURL(event).host, challenge)
  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=600',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return png
})
