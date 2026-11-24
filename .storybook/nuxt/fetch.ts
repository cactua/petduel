// Finto $fetch: risponde con i dati che la storia mette in `parameters.api` e registra ogni chiamata
// nel pannello Actions. Niente server: le storie funzionano anche senza avviare un sito
import { action } from 'storybook/actions'

type Handler = unknown | ((ctx: { url: string, method: string, query?: Record<string, unknown>, body?: unknown }) => unknown)

/**
 * Risposte finte delle API, per indirizzo. La chiave è "<indirizzo>" (ogni metodo) o "<METODO> <indirizzo>";
 * l'indirizzo può finire con * per indicare un prefisso. Il valore è la risposta o una funzione che la calcola;
 * un oggetto `{ __error: 400, message: '...' }` fa fallire la chiamata come farebbe il server
 */
export type ApiMocks = Record<string, Handler>

let mocks: ApiMocks = {}
let delay = 300

export function setApiMocks(next: ApiMocks | undefined, ms = 300) {
  mocks = next ?? {}
  delay = ms
}

function find(method: string, url: string): Handler | undefined {
  const path = url.split('?')[0]!
  const keys = [`${method} ${path}`, path]
  for (const key of keys) if (key in mocks) return mocks[key]
  for (const [key, value] of Object.entries(mocks)) {
    if (!key.endsWith('*')) continue
    const [m, p] = key.includes(' ') ? key.split(' ') as [string, string] : [null, key]
    if ((m === null || m === method) && path.startsWith(p.slice(0, -1))) return value
  }
  return undefined
}

const log = action('$fetch')

export async function resolveApi<T>(url: string, opts: { method?: string, query?: Record<string, unknown>, body?: unknown } = {}): Promise<T> {
  const method = (opts.method ?? 'GET').toUpperCase()
  log(`${method} ${url}`, opts.query ?? opts.body ?? '')
  const handler = find(method, url)
  await new Promise(r => setTimeout(r, delay))
  const value = typeof handler === 'function' ? await (handler as (c: object) => unknown)({ url, method, query: opts.query, body: opts.body }) : handler
  if (value && typeof value === 'object' && '__error' in value) {
    const v = value as { __error: number, message?: string }
    throw Object.assign(new Error(v.message ?? 'Errore'), { statusCode: v.__error, statusMessage: v.message, data: { statusMessage: v.message } })
  }
  // Senza risposta: GET dà null, il resto va a buon fine senza dati
  return (value ?? (method === 'GET' ? null : {})) as T
}

export const $fetch = Object.assign(
  <T = unknown>(url: string, opts?: { method?: string, query?: Record<string, unknown>, body?: unknown }) => resolveApi<T>(url, opts),
  { raw: resolveApi, create: () => resolveApi },
)
