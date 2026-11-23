// Messaggio leggibile da un errore di $fetch (statusMessage delle nostre API)
// Le API mandano una chiave (errors.*, validation.*) e i parametri in data.params: qui diventa testo
export function errorMessage(e: unknown, fallback = 'errors.generic') {
  const err = e as { data?: { statusMessage?: string, data?: { params?: Record<string, unknown> } }, statusMessage?: string, statusCode?: number }
  // Richiesta troppo grande, fermata prima delle nostre API (testo inglese "Payload Too Large")
  if (err?.statusCode === 413) return tr('errors.photoTooBig')
  const key = err?.data?.statusMessage ?? err?.statusMessage
  // Solo le nostre chiavi (errors.x, validation.y): i messaggi tecnici in inglese non arrivano alle persone
  return tr(key && /^[a-z]+\.[\w.]+$/i.test(key) ? key : fallback, err?.data?.data?.params)
}

// Solo percorsi interni: evita redirect verso altri siti (?redirect=//evil.com)
export function safeRedirect(target: unknown) {
  return typeof target === 'string' && /^\/(?![/\\])/.test(target) ? target : '/'
}
