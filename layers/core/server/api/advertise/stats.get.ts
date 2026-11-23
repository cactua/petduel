import { sql } from 'drizzle-orm'
import type { AdvertiseStats } from '#shared/models'

// Numeri pubblici per chi vuole fare pubblicità: voti e votanti degli ultimi 30 giorni, personaggi in gara.
// Cambiano lentamente: si ricalcolano al massimo ogni ora
export default defineCachedEventHandler(async (): Promise<AdvertiseStats> => {
  const db = await useDb()
  const { rows: [row] } = await db.execute<{ votes: number, voters: number, entries: number }>(sql`
    with recent as (
      select voter_id from votes where created_at > now() - interval '30 days'
      union all
      select voter_id from challenge_votes where created_at > now() - interval '30 days'
    )
    select
      (select count(*)::int from recent) as votes,
      (select count(distinct voter_id)::int from recent) as voters,
      (select count(*)::int from pets p where exists (select 1 from photos ph where ph.pet_id = p.id and ph.status = 'approved')) as entries`)
  const { every } = await getAdSettings()
  return { votes: row?.votes ?? 0, voters: row?.voters ?? 0, entries: row?.entries ?? 0, every }
}, { maxAge: 60 * 60, name: 'advertise-stats' })
