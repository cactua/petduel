import { and, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { CONSENT_COOKIE, type AdSlot, type ShownAd } from '#shared/models'
import { ads } from '../../db/schema'

// Impostazioni della pubblicità e prossimo annuncio da mostrare (scelto a caso, pesato) tra le campagne
// in onda adatte a chi vota: zona, lingua, specie del filtro (?species=), utente o ospite, giorno e ora, tetti.
// Il circuito esterno entra solo se configurato e se chi vota ha accettato i suoi cookie: come riserva quando nessuna campagna è adatta, o in gara col suo peso
export default defineEventHandler(async (event): Promise<AdSlot> => {
  const { network, ...settings } = await getAdSettings()
  if (!settings.every) return { settings, ad: null }

  const db = await useDb()
  const now = new Date()
  const live = await db.select().from(ads).where(and(
    eq(ads.active, true),
    or(isNull(ads.startsAt), lte(ads.startsAt, now)),
    or(isNull(ads.endsAt), gt(ads.endsAt, now)),
  ))
  const visitor = await adVisitor(event)
  const matching = live
    .map(ad => ({ ad, targeting: parseTargeting(ad.targeting), deal: parseDeal(ad.deal) }))
    .filter(c => adMatches(c.targeting, visitor))
  const capped = matching.length ? await cappedAds(matching, (await getVoter(event)).voterId) : new Set<number>()
  const eligible = matching.filter(c => !capped.has(c.ad.id)).map(c => c.ad)

  const candidates: { weight: number, pick: () => ShownAd }[] = eligible.map(ad => ({
    weight: ad.weight,
    pick: () => {
      const { title, body, cta } = adLocalized(ad, visitor.lang)
      return { id: ad.id, advertiser: ad.advertiser, title, body, cta, image: adImageUrl(ad.image), href: `/r/ad/${ad.id}` }
    },
  }))
  if (networkReady(network) && getCookie(event, CONSENT_COOKIE) === 'ads' && (network.mode === 'mix' || !eligible.length)) {
    candidates.push({ weight: network.weight, pick: () => ({ network: 'adsense', client: network.client, slot: network.slot }) })
  }
  const total = candidates.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  return { settings, ad: candidates.find(c => (r -= c.weight) < 0)?.pick() ?? null }
})
