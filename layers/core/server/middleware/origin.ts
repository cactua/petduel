const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Protezione CSRF: le richieste che modificano dati devono arrivare dal nostro stesso sito.
// Si somma al cookie di sessione SameSite=Lax.
export default defineEventHandler((event) => {
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) return

  const origin = getRequestHeader(event, 'origin')
  let originHost: string | null = null
  try {
    originHost = origin ? new URL(origin).host : null
  }
  catch {
    // Origin malformato o "null": trattato come assente
  }
  if (!originHost || originHost !== getRequestHost(event, { xForwardedHost: true })) {
    throw createError({ statusCode: 403, statusMessage: 'errors.forbidden' })
  }
})
