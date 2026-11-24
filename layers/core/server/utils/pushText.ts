import messages from '#site-messages'
import { REJECT_REASONS } from '#shared/models'

// Testi delle notifiche push, scritti dal server nella lingua di chi le riceve (senza database: si possono provare nei test)

const get = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)

/**
 * Traduzione minima lato server, con le stesse regole dei file di lingua usate dagli avvisi:
 * {param}, {'testo'} letterale, @:{'chiave'} collegata e "singolare | plurale" scelto da n
 */
export function serverT(locale: string, key: string, params: Record<string, unknown> = {}, n?: number): string {
  const dict = messages[locale] ?? messages.it!
  let raw = get(dict, key) ?? get(messages.it, key)
  if (typeof raw !== 'string') return key
  if (raw.includes(' | ')) {
    const forms = raw.split(' | ')
    raw = forms[n === 1 || forms.length === 1 ? 0 : 1]!
  }
  return (raw as string)
    .replace(/@:\{'([^']+)'\}/g, (_, k: string) => serverT(locale, k, params, n))
    .replace(/\{'([^']*)'\}/g, (_, lit: string) => lit)
    .replace(/\{(\w+)\}/g, (m, k: string) => (params[k] !== undefined ? String(params[k]) : m))
}

/** Testo di un avviso nella lingua di chi lo riceve (come notificationText nell'app) */
export function notificationPushText(n: { text: string, params: string | null }, locale: string) {
  if (!n.params) return n.text
  let p: Record<string, unknown>
  try {
    p = JSON.parse(n.params)
  }
  catch {
    return n.text
  }
  const saved = p[`challenge_${locale}`]
  if (typeof saved === 'string') p.challenge = saved
  else if (typeof p.challengeSlug === 'string') {
    // Sfide del calendario automatico: il titolo tradotto sta nei file di lingua (themes.<tema>)
    const theme = p.challengeSlug.replace(/-\d{4}-\d{2}-\d{2}$/, '')
    const title = get(messages[locale], `themes.${theme}.title`)
    if (typeof title === 'string') p.challenge = title
  }
  if (typeof p.reason === 'string') {
    const i = (REJECT_REASONS as readonly string[]).indexOf(p.reason)
    if (i >= 0) p.reason = serverT(locale, `reasons.${i}`)
  }
  if (typeof p.species === 'string') p.species = serverT(locale, `species.${p.species}.many`)
  return serverT(locale, n.text, p, typeof p.n === 'number' ? p.n : undefined)
}
