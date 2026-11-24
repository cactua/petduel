const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Protezione CSRF: le richieste che modificano dati devono arrivare dal nostro stesso sito.
// Si somma al cookie di sessione SameSite=Lax. Con NUXT_SITE_URL si confronta con quell'indirizzo;
// senza (sviluppo) con l'Host della richiesta, o X-Forwarded-Host se c'è
export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig().siteUrl
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) return

  const origin = getRequestHeader(event, 'origin')
  let originHost: string | null = null
  try {
    originHost = origin ? new URL(origin).host : null
  }
  catch {
    // Origin malformato o "null": trattato come assente
  }
  let expected = getRequestHost(event, { xForwardedHost: true })
  try {
    if (siteUrl) expected = new URL(siteUrl).host
  }
  catch {
    // NUXT_SITE_URL scritto male: resta il controllo sulla richiesta
  }
  if (!originHost || originHost !== expected) {
    throw createError({ statusCode: 403, statusMessage: 'errors.forbidden' })
  }
})
