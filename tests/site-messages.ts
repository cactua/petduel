// Come "#site-messages" generato da Nuxt, per i test: testi del nucleo con sopra quelli del sito degli animali
import { readFileSync } from 'node:fs'
import { LANGUAGES } from '../layers/core/i18n/languages'

type Messages = Record<string, unknown>
const isObject = (v: unknown): v is Messages => typeof v === 'object' && v !== null && !Array.isArray(v)
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base }
  for (const [k, v] of Object.entries(over)) out[k] = isObject(v) && isObject(out[k]) ? merge(out[k] as Messages, v) : v
  return out
}
const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as Messages

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- testi JSON di forma libera
const messages: Record<string, Record<string, any>> = Object.fromEntries(LANGUAGES.map(l => [
  l.code,
  merge(read(`../layers/core/i18n/locales/${l.code}.json`), read(`../sites/pets/i18n/locales/${l.code}.json`)),
]))
export default messages
