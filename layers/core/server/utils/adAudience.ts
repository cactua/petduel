import { sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import {
  AD_DEAL_DEFAULT, AD_LANGS, AD_TARGETING_DEFAULT, SPECIES, adDealSchema, adTargetingSchema, adTextFor, adTranslationsSchema,
  type AdDeal, type AdLang, type AdTargeting, type AdTranslations, type Species,
} from '#shared/models'
import type { Ad } from '../db/schema'

const TZ = 'Europe/Rome'

/**
 * Dove si trova chi vota, dall'indirizzo IP. Lo dice la rete davanti al sito:
 * Cloudflare (cf-ipcountry sempre; città e coordinate con "Add visitor location headers")
 * o Vercel (x-vercel-ip-*). Senza, la posizione è sconosciuta.
 * In sviluppo, senza proxy, si fa finta di essere in Italia (senza città);
 * per provare una zona precisa: NUXT_DEV_GEO="IT|Torino|45.07|7.69" nel file .env.
 * Gli header arrivano dal proxy: se il sito non è dietro uno dei due, chi vota potrebbe falsificarli
 * (al massimo si fa mostrare un annuncio di un'altra zona).
 */
export interface VisitorGeo {
  country: string | null
  city: string | null
  lat: number | null
  lng: number | null
  timezone: string | null
  // true = posizione finta dello sviluppo locale
  simulated?: boolean
}

export function visitorGeo(event: H3Event): VisitorGeo {
  const header = (...names: string[]) => {
    for (const n of names) {
      const v = getRequestHeader(event, n)?.trim()
      if (v) return v
    }
    return null
  }
  const decode = (v: string | null) => {
    if (!v) return null
    try {
      return decodeURIComponent(v)
    }
    catch {
      return v
    }
  }
  const num = (v: string | null) => (v && Number.isFinite(Number(v)) ? Number(v) : null)

  let country = header('cf-ipcountry', 'x-vercel-ip-country')?.toUpperCase() ?? null
  let city = decode(header('cf-ipcity', 'x-vercel-ip-city'))
  let lat = num(header('cf-iplatitude', 'x-vercel-ip-latitude'))
  let lng = num(header('cf-iplongitude', 'x-vercel-ip-longitude'))
  const timezone = header('cf-timezone', 'x-vercel-ip-timezone')

  let simulated = false
  if (!country && import.meta.dev) {
    const [c, ci, la, ln] = (process.env.NUXT_DEV_GEO || 'IT').split('|')
    country = c?.toUpperCase() || null
    city = ci || null
    lat = num(la ?? null)
    lng = num(ln ?? null)
    simulated = true
  }
  // XX = sconosciuto, T1 = rete Tor
  if (!country || !/^[A-Z]{2}$/.test(country) || country === 'XX' || country === 'T1') country = null
  return { country, city, lat, lng, timezone, simulated }
}

/** Lingua del sito per chi vota: il cookie scelto nel menu, se no la prima lingua del browser */
export function visitorLang(event: H3Event): AdLang | null {
  const isLang = (v: string | undefined): v is AdLang => !!v && (AD_LANGS as readonly string[]).includes(v)
  const cookie = getCookie(event, 'lingua')
  if (isLang(cookie)) return cookie
  const first = getRequestHeader(event, 'accept-language')?.split(',')[0]?.split('-')[0]?.trim().toLowerCase()
  return isLang(first) ? first : null
}

export function parseTargeting(raw: string | null): AdTargeting {
  if (!raw) return AD_TARGETING_DEFAULT
  const parsed = adTargetingSchema.safeParse(JSON.parse(raw))
  return parsed.success ? parsed.data : AD_TARGETING_DEFAULT
}
export function parseDeal(raw: string | null): AdDeal {
  if (!raw) return AD_DEAL_DEFAULT
  const parsed = adDealSchema.safeParse(JSON.parse(raw))
  return parsed.success ? parsed.data : AD_DEAL_DEFAULT
}

export function parseTranslations(raw: string | null): AdTranslations {
  if (!raw) return {}
  const parsed = adTranslationsSchema.safeParse(JSON.parse(raw))
  return parsed.success ? parsed.data : {}
}
const asLang = (v: string): AdLang => ((AD_LANGS as readonly string[]).includes(v) ? v as AdLang : 'it')

/** Testo e link della campagna nella lingua di chi la vede (o nella predefinita) */
export const adLocalized = (ad: Ad, lang: AdLang | null) =>
  adTextFor({ ...ad, defaultLang: asLang(ad.defaultLang), translations: parseTranslations(ad.translations) }, lang)

export interface AdVisitor extends VisitorGeo {
  lang: AdLang | null
  species: Species | null
  loggedIn: boolean
  now: Date
}

export async function adVisitor(event: H3Event): Promise<AdVisitor> {
  const { user } = await getUserSession(event)
  const species = getQuery(event).species
  return {
    ...visitorGeo(event),
    lang: visitorLang(event),
    species: typeof species === 'string' && (SPECIES as readonly string[]).includes(species) ? species as Species : null,
    loggedIn: !!user,
    now: new Date(),
  }
}

/** Distanza in km tra due punti (formula dell'emisenoverso) */
function km(a: { lat: number, lng: number }, b: { lat: number, lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** Giorno della settimana (1 = lunedì) e ora, nel fuso di chi vota (se non si sa, ora italiana) */
function localTime(now: Date, timezone: string | null) {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone ?? TZ, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  }
  catch {
    parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  }
  const weekday = parts.find(p => p.type === 'weekday')!.value
  return { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday) + 1, hour: Number(parts.find(p => p.type === 'hour')!.value) }
}

/** La campagna può essere mostrata a questa persona, qui e ora? */
export function adMatches(t: AdTargeting, v: AdVisitor) {
  if (t.countries.length || t.places.length) {
    const known = v.country !== null || v.lat !== null
    if (!known) {
      if (!t.unknownLocation) return false
    }
    else {
      const inCountry = v.country !== null && t.countries.includes(v.country)
      const inPlace = v.lat !== null && v.lng !== null && t.places.some(p => km({ lat: v.lat!, lng: v.lng! }, p) <= p.km)
      if (!inCountry && !inPlace) return false
    }
  }
  // Lingua o specie sconosciute (nessun filtro): non escludono
  if (t.languages.length && v.lang && !t.languages.includes(v.lang)) return false
  if (t.species.length && v.species && !t.species.includes(v.species)) return false
  if (t.audience === 'users' && !v.loggedIn) return false
  if (t.audience === 'guests' && v.loggedIn) return false
  if (t.days.length || t.hours) {
    const { day, hour } = localTime(v.now, v.timezone)
    if (t.days.length && !t.days.includes(day)) return false
    if (t.hours) {
      const { from, to } = t.hours
      // Fascia che passa la mezzanotte (22 → 2) se from > to
      const inside = from < to ? hour >= from && hour < to : hour >= from || hour < to
      if (!inside) return false
    }
  }
  return true
}

/**
 * Campagne che hanno raggiunto un tetto: visualizzazioni o clic totali,
 * o il massimo di volte al giorno (ora italiana) per questa persona
 */
export async function cappedAds(list: { ad: Ad, deal: AdDeal }[], voterId: string) {
  const withCaps = list.filter(({ deal }) => deal.maxViews || deal.maxClicks || deal.maxPerPersonDay)
  if (!withCaps.length) return new Set<number>()
  const db = await useDb()
  const ids = sql.join(withCaps.map(({ ad }) => sql`${ad.id}`), sql`, `)
  const { rows } = await db.execute<{ ad_id: number, views: number, clicks: number, mine: number }>(sql`
    select ad_id,
      count(*) filter (where type = 'view')::int as views,
      count(*) filter (where type = 'click')::int as clicks,
      count(*) filter (where type = 'view' and voter_id = ${voterId}
        and created_at >= (date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}))::int as mine
    from ad_events where ad_id in (${ids}) group by ad_id
  `)
  const capped = new Set<number>()
  for (const { ad, deal } of withCaps) {
    const r = rows.find(x => x.ad_id === ad.id)
    if (!r) continue
    if ((deal.maxViews && r.views >= deal.maxViews) || (deal.maxClicks && r.clicks >= deal.maxClicks)
      || (deal.maxPerPersonDay && r.mine >= deal.maxPerPersonDay)) capped.add(ad.id)
  }
  return capped
}

/** Paese, città e lingua da salvare con una visualizzazione o un clic */
export function adEventPlace(event: H3Event) {
  const { country, city } = visitorGeo(event)
  return { country, city: city?.slice(0, 80) ?? null, lang: visitorLang(event) }
}
