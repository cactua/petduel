// Immagini degli annunci: pubbliche, il nome non cambia mai contenuto
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) throw createError({ statusCode: 404 })
  const data = await useStorage('uploads').getItemRaw(`ads:${name}`)
  if (!data) throw createError({ statusCode: 404 })
  setResponseHeaders(event, {
    'content-type': 'image/webp',
    'cache-control': 'public, max-age=604800',
    'content-security-policy': 'default-src \'none\'; sandbox',
  })
  return data
})
