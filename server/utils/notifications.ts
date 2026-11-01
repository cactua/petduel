import { sql } from 'drizzle-orm'
import { TOP_RANK, type Species } from '#shared/models'
import { notifications } from '../db/schema'
import { useDb } from './db'

const TZ = 'Europe/Rome'
// Risultati delle sfide finite da non più di tanti giorni
const RESULTS_DAYS = 14
// Le soglie di classifica settimanale per specie che meritano un avviso, dalla migliore (oltre la top non si vede)
const RANK_TIERS = [1, 3, TOP_RANK] as const
// Il ricalcolo per utente al massimo una volta ogni tanto: la campanella si apre spesso
const REFRESH_MS = 60_000
const lastRefresh = new Map<number, number>()

/**
 * Crea un avviso; se esiste già lo stesso evento (stessa key) non fa niente.
 * `text` è una chiave notif.* e `params` i suoi valori: lo traduce il sito, nella lingua di chi lo legge.
 */
export async function notify(userId: number, key: string, n: { emoji: string, text: string, params: Record<string, string | number>, link?: string | null }) {
  const db = await useDb()
  await db.insert(notifications).values({ userId, key, emoji: n.emoji, text: n.text, params: JSON.stringify(n.params), link: n.link ?? null }).onConflictDoNothing()
}

const place = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏁')

/**
 * Avvisi calcolati al momento invece che da un job programmato: risultati delle sfide finite
 * e posizioni raggiunte nella classifica settimanale. La key evita i doppioni.
 */
export async function refreshNotifications(userId: number) {
  const now = Date.now()
  if (now - (lastRefresh.get(userId) ?? 0) < REFRESH_MS) return
  lastRefresh.set(userId, now)
  const db = await useDb()

  // Posizione finale di ogni pet dell'utente nelle sfide appena concluse (stesso ordine della classifica della sfida)
  const { rows: results } = await db.execute<{ cid: number, slug: string, title: string, pet_id: number, name: string, rank: number, total: number }>(sql`
    select * from (
      select c.id as cid, c.slug, c.title, p.id as pet_id, p.name, p.owner_id,
        row_number() over (partition by c.id order by e.wins desc, e.elo desc, e.id)::int as rank,
        count(*) over (partition by c.id)::int as total
      from challenges c
      join challenge_entries e on e.challenge_id = c.id
      join photos ph on ph.id = e.photo_id and ph.status = 'approved'
      join pets p on p.id = e.pet_id and not p.hide_from_rankings
      where c.ends_at <= now() and c.ends_at > now() - ${`${RESULTS_DAYS} days`}::interval
    ) r
    where r.owner_id = ${userId} and r.rank <= ${TOP_RANK}`)
  for (const r of results) {
    await notify(userId, `sfida:${r.cid}:${r.pet_id}`, {
      emoji: place(r.rank),
      text: r.rank === 1 ? 'notif.challengeWon' : 'notif.challengePlace',
      params: { name: r.name, challenge: r.title, challengeSlug: r.slug, rank: r.rank, total: r.total },
      // Un bel risultato si festeggia: si apre la pagina del pet con la card della sfida pronta da condividere
      link: `/pet/${r.pet_id}?sfida=${r.slug}&condividi=1`,
    })
  }

  // Riepilogo della settimana appena finita: i cuori ricevuti dai propri pet, senza confronti.
  // Chi non ne ha ricevuti non riceve niente
  const { rows: [recap] } = await db.execute<{ week: string, total: number, best_id: number, best_name: string }>(sql`
    with week as (select date_trunc('week', now() at time zone ${TZ}) as this_week),
    hearts as (
      select p.id, p.name, count(*)::int as n
      from votes v join pets p on p.id = v.winner_id
      where p.owner_id = ${userId} and v.delta > 0
        and v.created_at >= ((select this_week from week) - interval '1 week') at time zone ${TZ}
        and v.created_at < (select this_week from week) at time zone ${TZ}
      group by p.id
    )
    select to_char((select this_week from week) - interval '1 week', 'YYYY-MM-DD') as week,
      (select sum(n)::int from hearts) as total, id as best_id, name as best_name
    from hearts order by n desc, id limit 1`)
  if (recap?.total) {
    await notify(userId, `cuori:${recap.week}`, {
      emoji: '❤️',
      text: 'notif.weeklyHearts',
      params: { n: recap.total, name: recap.best_name },
      link: `/pet/${recap.best_id}`,
    })
  }

  // Classifica settimanale per specie, come in /classifica: cuori ricevuti da lunedì (a pari cuori decide l'Elo)
  const { rows: ranks } = await db.execute<{ id: number, name: string, species: Species, rank: number, week: string }>(sql`
    with week as (select date_trunc('week', now() at time zone ${TZ}) at time zone ${TZ} as since),
    stats as (
      select p.id, p.name, p.species, p.owner_id,
        p.elo, count(v.id) as score
      from pets p
      left join votes v on v.winner_id = p.id and v.delta > 0 and v.created_at >= (select since from week)
      where p.species in (select species from pets where owner_id = ${userId})
        and not p.hide_from_rankings
        and exists (select 1 from photos ph where ph.pet_id = p.id and ph.status = 'approved')
      group by p.id
    ),
    ranked as (
      select stats.*, row_number() over (partition by species order by score desc, elo desc, id)::int as rank from stats
    )
    select id, name, species, rank, to_char((select since from week) at time zone ${TZ}, 'YYYY-MM-DD') as week
    from ranked where owner_id = ${userId} and score > 0 and rank <= ${RANK_TIERS[RANK_TIERS.length - 1]}`)
  if (!ranks.length) return
  // Soglie già avvisate questa settimana: chi è stato primo e poi scende al secondo posto non riceve "top 3"
  const { rows: sent } = await db.execute<{ key: string }>(sql`
    select key from ${notifications} where user_id = ${userId} and key like ${`classifica:${ranks[0]!.week}:%`}`)
  const best = new Map<number, number>()
  for (const { key } of sent) {
    const [, , petId, tier] = key.split(':')
    best.set(Number(petId), Math.min(best.get(Number(petId)) ?? Infinity, Number(tier)))
  }
  for (const r of ranks) {
    const tier = RANK_TIERS.find(t => r.rank <= t)!
    if ((best.get(r.id) ?? Infinity) <= tier) continue
    await notify(userId, `classifica:${r.week}:${r.id}:${tier}`, {
      emoji: tier === 1 ? '👑' : tier === 3 ? '🏆' : '📈',
      text: tier === 1 ? 'notif.rankFirst' : 'notif.rankTop',
      params: { name: r.name, species: r.species, tier },
      link: `/pet/${r.id}?condividi=1`,
    })
  }
}
