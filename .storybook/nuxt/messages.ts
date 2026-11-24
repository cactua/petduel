// Testi di ogni sito come li unisce @nuxtjs/i18n: nucleo, sopra il layer shelters (se il sito lo usa), sopra il sito.
// Gli oggetti si uniscono voce per voce, liste e testi si sostituiscono (come mergeMessages nel nuxt.config)
import { LANGUAGES } from '../../layers/core/i18n/languages'
import { SITES, SITES_WITH_SHELTERS, type SiteId } from './site'

type Messages = Record<string, unknown>
const isObject = (v: unknown): v is Messages => typeof v === 'object' && v !== null && !Array.isArray(v)
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base }
  for (const [k, v] of Object.entries(over)) out[k] = isObject(v) && isObject(out[k]) ? merge(out[k] as Messages, v) : v
  return out
}

type Json = Record<string, { default: Messages }>
const core = import.meta.glob<{ default: Messages }>('../../layers/core/i18n/locales/*.json', { eager: true }) as Json
const shelters = import.meta.glob<{ default: Messages }>('../../layers/shelters/i18n/locales/*.json', { eager: true }) as Json
const sites = import.meta.glob<{ default: Messages }>('../../sites/*/i18n/locales/*.json', { eager: true }) as Json

const pick = (files: Json, end: string) => Object.entries(files).find(([p]) => p.endsWith(end))?.[1].default ?? {}

export function siteMessages(id: SiteId): Record<string, Messages> {
  return Object.fromEntries(LANGUAGES.map(({ code, file }) => {
    // Come i18n.config.ts: il nome del sito è lo stesso in ogni lingua
    let m: Messages = { site: { name: SITES[id].name } }
    m = merge(m, pick(core, `/core/i18n/locales/${file}`))
    if (SITES_WITH_SHELTERS.includes(id)) m = merge(m, pick(shelters, `/shelters/i18n/locales/${file}`))
    m = merge(m, pick(sites, `/sites/${id}/i18n/locales/${file}`))
    return [code, m]
  }))
}
