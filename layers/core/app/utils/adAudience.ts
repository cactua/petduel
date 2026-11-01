import { SPECIES_EMOJI, type AdDeal, type AdTargeting } from '#shared/models'
import { speciesName } from '#shared/speciesNames'

// Tutti i paesi (ISO 3166-1 alpha-2, più XK Kosovo che usano i proxy): i nomi li dà il browser
const CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ')
// I più probabili per un sito italiano, in cima all'elenco
export const NEAR_COUNTRIES = ['IT', 'SM', 'VA', 'CH', 'FR', 'AT', 'SI', 'DE', 'ES', 'GB', 'US']

let names: Intl.DisplayNames | undefined
export function countryName(code: string | null) {
  if (!code) return 'Sconosciuto'
  names ??= new Intl.DisplayNames('it', { type: 'region' })
  try {
    return names.of(code) ?? code
  }
  catch {
    return code
  }
}
export const ALL_COUNTRIES = () => CODES.map(code => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'it'))

/** Bandiera dal codice paese (due lettere → due simboli regionali) */
export const flag = (code: string | null) =>
  code ? String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0))) : '🌐'

export const LANG_NAMES: Record<string, string> = { it: 'Italiano', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' }
export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const euro = (cents: number) => (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
export { euro as formatEuro }

/** Riassunto del pubblico in poche voci, per l'elenco e l'anteprima */
export function audienceSummary(t: AdTargeting, deal?: AdDeal) {
  const out: string[] = []
  const where = [...t.countries.map(c => `${flag(c)} ${countryName(c)}`), ...t.places.map(p => `📍 ${p.label.split(',')[0]} (${p.km} km)`)]
  out.push(where.length ? where.join(', ') : '🌍 Ovunque')
  if (t.languages.length) out.push(t.languages.map(l => LANG_NAMES[l]).join(', '))
  if (t.species.length) out.push(t.species.map(s => `${SPECIES_EMOJI[s]} ${speciesName(s, 'many')}`).join(', '))
  if (t.audience === 'users') out.push('Solo utenti registrati')
  if (t.audience === 'guests') out.push('Solo ospiti')
  if (t.days.length && t.days.length < 7) out.push([...t.days].sort().map(d => DAY_NAMES[d - 1]).join(' '))
  if (t.hours) out.push(`${t.hours.from}–${t.hours.to}`)
  if (deal?.maxPerPersonDay) out.push(`max ${deal.maxPerPersonDay}× al giorno a persona`)
  return out
}

export function priceSummary(deal: AdDeal) {
  if (deal.priceType === 'flat') return `${euro(deal.priceCents)} in tutto`
  if (deal.priceType === 'cpm') return `${euro(deal.priceCents)} ogni 1.000 visualizzazioni`
  if (deal.priceType === 'cpc') return `${euro(deal.priceCents)} a clic`
  return ''
}
