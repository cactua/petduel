// /card/challenge/<slug>.png: anteprima del link di una sfida (1200×630)
export default defineEventHandler(async (event) => {
  const match = /^([a-z0-9-]{1,80})\.png$/.exec(getRouterParam(event, 'name') ?? '')
  if (!match) throw createError({ statusCode: 404 })
  const png = await renderChallengeCard(match[1]!, getRequestURL(event).host)
  setResponseHeaders(event, {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=600',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return png
})
