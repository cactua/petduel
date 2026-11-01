import { desc, sql } from 'drizzle-orm'
import { adValueCents, type AdminAds } from '#shared/models'
import { ads, adNetworkViews } from '../../db/schema'

const TZ = 'Europe/Rome'

// Campagne con visualizzazioni, clic (totali e unici), andamento degli ultimi 14 giorni,
// provenienza (paese e città), lingua e ore del giorno, valore maturato secondo il prezzo concordato
export default defineEventHandler(async (event): Promise<AdminAds> => {
  await requireAdmin(event)
  const db = await useDb()
  const list = await db.select().from(ads).orderBy(desc(ads.createdAt))

  const { rows: totals } = await db.execute<{ ad_id: number, views: number, uviews: number, clicks: number, uclicks: number, today: number }>(sql`
    select ad_id,
      count(*) filter (where type = 'view')::int as views,
      count(distinct voter_id) filter (where type = 'view')::int as uviews,
      count(*) filter (where type = 'click')::int as clicks,
      count(distinct voter_id) filter (where type = 'click')::int as uclicks,
      count(*) filter (where type = 'view' and created_at >= (date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}))::int as today
    from ad_events group by ad_id
  `)
  const { rows: places } = await db.execute<{ ad_id: number, country: string | null, city: string | null, views: number, clicks: number }>(sql`
    select ad_id, country, city,
      count(*) filter (where type = 'view')::int as views,
      count(*) filter (where type = 'click')::int as clicks
    from ad_events group by 1, 2, 3 order by views desc, clicks desc
  `)
  const { rows: langs } = await db.execute<{ ad_id: number, lang: string | null, views: number, clicks: number }>(sql`
    select ad_id, lang,
      count(*) filter (where type = 'view')::int as views,
      count(*) filter (where type = 'click')::int as clicks
    from ad_events group by 1, 2 order by views desc
  `)
  const { rows: hours } = await db.execute<{ ad_id: number, hour: number, views: number }>(sql`
    select ad_id, extract(hour from created_at at time zone ${TZ})::int as hour, count(*)::int as views
    from ad_events where type = 'view' group by 1, 2
  `)
  const { rows: daily } = await db.execute<{ ad_id: number, day: string, views: number, clicks: number }>(sql`
    select ad_id, to_char(created_at at time zone ${TZ}, 'YYYY-MM-DD') as day,
      count(*) filter (where type = 'view')::int as views,
      count(*) filter (where type = 'click')::int as clicks
    from ad_events where created_at > now() - interval '14 days' group by 1, 2
  `)
  const dayKeys = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.now() - (13 - i) * 86_400_000).toLocaleDateString('sv-SE', { timeZone: TZ }))

  const { rows: [net] } = await db.execute<{ views: number, uviews: number }>(sql`
    select count(*)::int as views, count(distinct voter_id)::int as uviews from ${adNetworkViews}
  `)
  const { rows: netDaily } = await db.execute<{ day: string, views: number }>(sql`
    select to_char(created_at at time zone ${TZ}, 'YYYY-MM-DD') as day, count(*)::int as views
    from ${adNetworkViews} where created_at > now() - interval '14 days' group by 1
  `)

  // Dove il sito vede l'admin adesso: aiuta a capire perché una campagna per zona non compare
  const { country, city, lat, simulated } = visitorGeo(event)

  return {
    settings: await getAdSettings(),
    you: { country, city, hasCoords: lat !== null, simulated: !!simulated, lang: visitorLang(event) },
    network: {
      views: net?.views ?? 0,
      uniqueViews: net?.uviews ?? 0,
      days: dayKeys.map(day => ({ day, views: netDaily.find(r => r.day === day)?.views ?? 0 })),
    },
    ads: list.map((a) => {
      const t = totals.find(r => r.ad_id === a.id)
      const deal = parseDeal(a.deal)
      const views = t?.views ?? 0
      const clicks = t?.clicks ?? 0
      return {
        id: a.id,
        name: a.name,
        advertiser: a.advertiser,
        title: a.title,
        body: a.body,
        cta: a.cta,
        url: a.url,
        weight: a.weight,
        active: a.active,
        startDate: adTimeToDate(a.startsAt),
        endDate: adTimeToDate(a.endsAt, true),
        image: adImageUrl(a.image),
        imageSource: adImageUrl(a.imageSource),
        imageCrop: a.imageCrop ? JSON.parse(a.imageCrop) : null,
        defaultLang: a.defaultLang as AdminAds['ads'][number]['defaultLang'],
        translations: parseTranslations(a.translations),
        targeting: parseTargeting(a.targeting),
        deal,
        status: adStatusWithCaps(a, deal, views, clicks),
        views,
        uniqueViews: t?.uviews ?? 0,
        clicks,
        uniqueClicks: t?.uclicks ?? 0,
        viewsToday: t?.today ?? 0,
        valueCents: adValueCents(deal, views, clicks),
        places: places.filter(r => r.ad_id === a.id).slice(0, 8).map(({ country, city, views, clicks }) => ({ country, city, views, clicks })),
        languages: langs.filter(r => r.ad_id === a.id).map(({ lang, views, clicks }) => ({ lang, views, clicks })),
        hours: Array.from({ length: 24 }, (_, h) => hours.find(r => r.ad_id === a.id && r.hour === h)?.views ?? 0),
        days: dayKeys.map((day) => {
          const d = daily.find(r => r.ad_id === a.id && r.day === day)
          return { day, views: d?.views ?? 0, clicks: d?.clicks ?? 0 }
        }),
      }
    }),
  }
})
