import { sql } from 'drizzle-orm'
import type { AdminActivity, AdminDay, AdminOverview } from '#shared/models'

const TZ = 'Europe/Rome'
const DAYS = 14

// Panoramica: cose da fare, cosa succede adesso, oggi, andamento delle ultime due settimane
export default defineEventHandler(async (event): Promise<AdminOverview> => {
  await requireAdmin(event)
  const db = await useDb()
  const today = sql`(date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ})`

  const { rows: [c] } = await db.execute<Record<string, number>>(sql`
    select
      (select count(*)::int from photos where status = 'pending') as pending_photos,
      (select count(*)::int from shelters where status = 'pending') as pending_shelters,
      (select count(distinct voter_id)::int from (
        select voter_id from votes where created_at > now() - interval '5 minutes'
        union all select voter_id from challenge_votes where created_at > now() - interval '5 minutes'
      ) v) as online,
      (select count(*)::int from votes where created_at > now() - interval '1 hour')
        + (select count(*)::int from challenge_votes where created_at > now() - interval '1 hour') as last_hour,
      (select count(*)::int from votes where created_at >= ${today})
        + (select count(*)::int from challenge_votes where created_at >= ${today}) as votes_today,
      (select count(*)::int from votes where created_at >= ${today} and voter_id not like 'u:%')
        + (select count(*)::int from challenge_votes where created_at >= ${today} and voter_id not like 'u:%') as anon_today,
      (select count(*)::int from users where created_at >= ${today}) as signups_today,
      (select count(*)::int from photos where created_at >= ${today} and credit is null) as uploads_today,
      (select count(*)::int from ad_events where type = 'view' and created_at >= ${today}) as ad_views,
      (select count(*)::int from ad_events where type = 'click' and created_at >= ${today}) as ad_clicks,
      (select count(*)::int from users) as users,
      (select count(*)::int from pets) as pets,
      (select count(*)::int from photos where status = 'approved') as photos,
      (select count(*)::int from votes) + (select count(*)::int from challenge_votes) as votes
  `)

  // Una riga per giorno, anche per quelli senza attività
  const { rows: days } = await db.execute<{ day: string, votes: number, anon: number, signups: number, uploads: number }>(sql`
    with d as (
      select generate_series(${today} - interval '${sql.raw(String(DAYS - 1))} days', ${today}, interval '1 day') as start
    ), v as (
      select created_at, voter_id from votes union all select created_at, voter_id from challenge_votes
    )
    select to_char(d.start at time zone ${TZ}, 'YYYY-MM-DD') as day,
      (select count(*)::int from v where v.created_at >= d.start and v.created_at < d.start + interval '1 day') as votes,
      (select count(*)::int from v where v.created_at >= d.start and v.created_at < d.start + interval '1 day' and v.voter_id not like 'u:%') as anon,
      (select count(*)::int from users u where u.created_at >= d.start and u.created_at < d.start + interval '1 day') as signups,
      (select count(*)::int from photos p where p.credit is null and p.created_at >= d.start and p.created_at < d.start + interval '1 day') as uploads
    from d order by d.start
  `)

  // Ultimi eventi da più tabelle, i più recenti per primi
  const { rows: feed } = await db.execute<{ at: Date, kind: string, a: string | null, b: string | null, id: number | null }>(sql`
    (select created_at as at, 'signup' as kind, username as a, null::text as b, null::int as id from users order by created_at desc limit 15)
    union all
    (select p.created_at, 'upload', pe.name, u.username, pe.id from photos p join pets pe on pe.id = p.pet_id join users u on u.id = pe.owner_id
      where p.credit is null order by p.created_at desc limit 15)
    union all
    (select p.reviewed_at, 'reviewed-' || p.status, pe.name, r.username, pe.id from photos p join pets pe on pe.id = p.pet_id
      left join users r on r.id = p.reviewed_by where p.reviewed_at is not null order by p.reviewed_at desc limit 10)
    union all
    (select created_at, 'shelter', name, status, null from shelters order by created_at desc limit 5)
    union all
    (select ar.created_at, 'adoption', pe.name, s.name, pe.id from adoption_requests ar join pets pe on pe.id = ar.pet_id
      join shelters s on s.id = ar.shelter_id order by ar.created_at desc limit 5)
    union all
    (select e.created_at, 'entry', pe.name, c.title, pe.id from challenge_entries e join pets pe on pe.id = e.pet_id
      join challenges c on c.id = e.challenge_id order by e.created_at desc limit 10)
    union all
    (select e.created_at, 'ad-click', a.name, null, null from ad_events e join ads a on a.id = e.ad_id
      where e.type = 'click' order by e.created_at desc limit 10)
    order by at desc limit 30
  `)

  const activity = feed.map((r): AdminActivity | null => {
    const at = new Date(r.at).toISOString()
    const pet = r.id ? `/pet/${r.id}` : null
    switch (r.kind) {
      case 'signup': return { at, emoji: '👋', text: `Nuovo utente @${r.a}`, link: `/admin/utenti?q=${r.a}` }
      case 'upload': return { at, emoji: '📸', text: `@${r.b} ha caricato una foto di ${r.a}`, link: '/admin/foto' }
      case 'reviewed-approved': return { at, emoji: '✅', text: `Foto di ${r.a} approvata${r.b ? ` da @${r.b}` : ''}`, link: pet }
      case 'reviewed-rejected': return { at, emoji: '🚫', text: `Foto di ${r.a} rifiutata${r.b ? ` da @${r.b}` : ''}`, link: null }
      case 'shelter': return { at, emoji: '🏠', text: `Rifugio "${r.a}" registrato`, link: '/admin/rifugi' }
      case 'adoption': return { at, emoji: '💌', text: `Richiesta di adozione per ${r.a} a ${r.b}`, link: pet }
      case 'entry': return { at, emoji: '🏁', text: `${r.a} partecipa a "${r.b}"`, link: pet }
      case 'ad-click': return { at, emoji: '📣', text: `Clic sulla pubblicità "${r.a}"`, link: '/admin/pubblicita' }
      default: return null
    }
  }).filter(a => a !== null)

  const { rows: [challenge] } = await db.execute<{ slug: string, title: string, emoji: string, entries: number, ends_at: Date }>(sql`
    select c.slug, c.title, c.emoji, c.ends_at, (select count(*)::int from challenge_entries e where e.challenge_id = c.id) as entries
    from challenges c where c.starts_at <= now() and c.ends_at > now() order by c.starts_at desc limit 1
  `)

  const n = c!
  return {
    todo: { photos: n.pending_photos!, shelters: n.pending_shelters! },
    now: { onlineVoters: n.online!, votesLastHour: n.last_hour! },
    today: {
      votes: n.votes_today!,
      anonShare: n.votes_today ? n.anon_today! / n.votes_today : 0,
      signups: n.signups_today!,
      uploads: n.uploads_today!,
      adViews: n.ad_views!,
      adClicks: n.ad_clicks!,
    },
    totals: { users: n.users!, pets: n.pets!, photos: n.photos!, votes: n.votes! },
    activeChallenge: challenge
      ? { slug: challenge.slug, title: challenge.title, emoji: challenge.emoji, entries: challenge.entries, endsAt: new Date(challenge.ends_at).toISOString() }
      : null,
    days: days.map((d): AdminDay => ({ day: d.day, votes: d.votes, anonVotes: d.anon, signups: d.signups, uploads: d.uploads })),
    activity,
  }
})
