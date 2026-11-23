// Il limite di dimensione delle richieste (nuxt-security, requestSizeLimiter) legge l'header Content-Length.
// Una richiesta "a pezzi" (Transfer-Encoding: chunked) non lo manda e verrebbe letta tutta in memoria:
// i browser lo mandano sempre quando inviano un modulo o una foto, quindi senza si rifiuta
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) return
  const chunked = getRequestHeader(event, 'transfer-encoding')
  if (chunked && !getRequestHeader(event, 'content-length')) {
    throw createError({ statusCode: 411, statusMessage: 'errors.forbidden' })
  }
})
