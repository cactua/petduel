// Messaggio leggibile da un errore di $fetch (statusMessage delle nostre API)
// Le API mandano una chiave (errors.*, validation.*) e i parametri in data.params: qui diventa testo
export function errorMessage(e: unknown, fallback = 'errors.generic') {
  const err = e as { data?: { statusMessage?: string, data?: { params?: Record<string, unknown> } }, statusMessage?: string }
  return tr(err?.data?.statusMessage ?? err?.statusMessage ?? fallback, err?.data?.data?.params)
}

// Solo percorsi interni: evita redirect verso altri siti (?redirect=//evil.com)
export function safeRedirect(target: unknown) {
  return typeof target === 'string' && /^\/(?![/\\])/.test(target) ? target : '/'
}
