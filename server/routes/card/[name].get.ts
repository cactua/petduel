import { z } from 'zod'

const querySchema = z.object({
  formato: z.enum(['story', 'og']).catch('story'),
  // Una sfida sconosciuta o malformata non blocca la card: si ignora
  sfida: z.string().regex(/^[a-z0-9-]{1,80}$/).optional().catch(undefined),
})

// /card/<id>.png?formato=story|og&sfida=<slug>: immagine da condividere, solo per pet pubblici
export default defineEventHandler(async (event) => {
  const match = /^(\d{1,9})\.png$/.exec(getRouterParam(event, 'name') ?? '')
  if (!match) throw createError({ statusCode: 404 })
  const { formato, sfida } = await getValidatedQuery(event, querySchema.parse)

  const png = await renderPetCard(Number(match[1]), formato, getRequestURL(event).host, sfida)
  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=600',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return png
})
