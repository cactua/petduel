import { and, desc, eq, gt, inArray, lte, sql } from 'drizzle-orm'
import type { ChallengeStanding, ChallengeStatus, ChallengeSummary, Trophy } from '#shared/models'
import { challengeEntries, challenges, photos, pets, users, type Challenge } from '../db/schema'
import { imageUrl, useDb } from './db'
import { CHALLENGE_THEMES } from '#shared/themes'

const TZ = 'Europe/Rome'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const THEMES = CHALLENGE_THEMES

export function challengeStatus(c: Pick<Challenge, 'startsAt' | 'endsAt'>, now = new Date()): ChallengeStatus {
  if (now < c.startsAt) return 'upcoming'
  if (now < c.endsAt) return 'active'
  return 'ended'
}

/** Garantisce che ci sia sempre una sfida in corso e una per la settimana prossima (se il sito ha un calendario di temi). */
export async function ensureChallenges() {
  if (!THEMES.length) return
  const db = await useDb()
  const { rows: [week] } = await db.execute<{ start: Date }>(
    sql`select date_trunc('week', now() at time zone ${TZ}) at time zone ${TZ} as start`,
  )
  const thisWeek = new Date(week!.start)
  for (const start of [thisWeek, await romeMidnightAfter(thisWeek, 7)]) {
    const [overlap] = await db.select({ id: challenges.id }).from(challenges)
      .where(and(lte(challenges.startsAt, start), gt(challenges.endsAt, start)))
      .limit(1)
    if (overlap) continue
    const theme = THEMES[Math.floor(start.getTime() / WEEK_MS) % THEMES.length]!
    await db.insert(challenges).values({
      slug: `${theme.slug}-${romeDate(start)}`,
      title: theme.title,
      description: theme.description,
      emoji: theme.emoji,
      species: theme.species ?? null,
      startsAt: start,
      // Fine alla mezzanotte italiana del lunedì dopo, anche col cambio d'ora
      endsAt: await romeMidnightAfter(start, 7),
    }).onConflictDoNothing()
  }
  await enterExamplePets()
}

// Pet di esempio iscritti a ogni sfida automatica non ancora finita
const EXAMPLES_PER_CHALLENGE = 16

/**
 * Iscrive alle sfide automatiche alcuni pet di esempio (account tecnico "petduel") della specie giusta,
 * con una foto approvata a caso: così una sfida appena partita ha già avversari da votare.
 * Lo fa una volta per sfida; le sfide programmate dai moderatori e quelle per i rifugi restano come sono.
 */
async function enterExamplePets() {
  const db = await useDb()
  await db.execute(sql`
    with open as (
      select c.id, c.species from challenges c
      where c.created_by is null and not c.adoption_only and c.ends_at > now()
        and not exists (
          select 1 from challenge_entries e join pets p on p.id = e.pet_id join users u on u.id = p.owner_id
          where e.challenge_id = c.id and u.username = 'petduel')
    ),
    picks as (
      select o.id as challenge_id, p.id as pet_id,
        (select ph.id from photos ph where ph.pet_id = p.id and ph.status = 'approved' order by random() limit 1) as photo_id,
        row_number() over (partition by o.id order by random()) as n
      from open o
      join pets p on o.species is null or p.species = o.species
      join users u on u.id = p.owner_id and u.username = 'petduel'
    )
    insert into challenge_entries (challenge_id, pet_id, photo_id)
    select challenge_id, pet_id, photo_id from picks
    where n <= ${EXAMPLES_PER_CHALLENGE} and photo_id is not null
    on conflict do nothing`)
}

// "2026-11-02" nel fuso italiano
export const romeDate = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: TZ })

/** Mezzanotte italiana di `days` giorni dopo la data italiana di `from`. */
export async function romeMidnightAfter(from: Date | string, days: number) {
  const db = await useDb()
  const day = typeof from === 'string' ? from : romeDate(from)
  const { rows: [row] } = await db.execute<{ at: Date }>(
    sql`select ((${day}::date + ${days}::int)::timestamp at time zone ${TZ}) as at`,
  )
  return new Date(row!.at)
}

export async function getChallenge(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })
  const db = await useDb()
  const [c] = await db.select().from(challenges).where(eq(challenges.slug, slug))
  if (!c) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })
  return c
}

/** Classifica della sfida per cuori ricevuti (a pari cuori decide l'Elo, che non si mostra): solo foto approvate. */
export async function loadStandings(challengeId: number, limit = 50): Promise<ChallengeStanding[]> {
  const db = await useDb()
  const rows = await db.select({ entry: challengeEntries, pet: pets, image: photos.image, owner: users.username })
    .from(challengeEntries)
    .innerJoin(photos, eq(photos.id, challengeEntries.photoId))
    .innerJoin(pets, eq(pets.id, challengeEntries.petId))
    .innerJoin(users, eq(users.id, pets.ownerId))
    .where(and(eq(challengeEntries.challengeId, challengeId), eq(photos.status, 'approved'), inRankings))
    .orderBy(desc(challengeEntries.wins), desc(challengeEntries.elo), challengeEntries.id)
    .limit(limit)

  return rows.map((r, i) => ({
    entryId: r.entry.id,
    id: r.pet.id,
    name: r.pet.name,
    species: r.pet.species,
    breed: r.pet.breed,
    city: r.pet.city,
    image: imageUrl(r.image),
    owner: r.owner,
    rank: i + 1,
    score: r.entry.wins,
  }))
}

export async function toSummaries(list: Challenge[]): Promise<ChallengeSummary[]> {
  if (!list.length) return []
  const db = await useDb()
  const ids = list.map(c => c.id)
  const counts = await db.select({ id: challengeEntries.challengeId, n: sql<number>`count(*)::int` })
    .from(challengeEntries)
    .innerJoin(photos, eq(photos.id, challengeEntries.photoId))
    .innerJoin(pets, eq(pets.id, challengeEntries.petId))
    .where(and(inArray(challengeEntries.challengeId, ids), eq(photos.status, 'approved'), inRankings))
    .groupBy(challengeEntries.challengeId)

  const now = new Date()
  return Promise.all(list.map(async (c) => {
    const status = challengeStatus(c, now)
    // Conclusa: il vincitore. In corso: i primi tre, per l'anteprima sulla card
    const standings = status === 'upcoming' ? [] : await loadStandings(c.id, status === 'ended' ? 1 : 3)
    const top = status === 'ended' ? standings[0] : undefined
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      emoji: c.emoji,
      species: c.species,
      adoptionOnly: c.adoptionOnly,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      status,
      entries: counts.find(x => x.id === c.id)?.n ?? 0,
      winner: top ? { petId: top.id, name: top.name, image: top.image, owner: top.owner } : null,
      leaders: status === 'active' ? standings.map(s => ({ petId: s.id, name: s.name, image: s.image })) : [],
    }
  }))
}

/** Sfide concluse vinte da ciascun pet. */
export async function loadTrophies(petIds: number[]) {
  const trophies = new Map<number, Trophy[]>()
  if (!petIds.length) return trophies
  const db = await useDb()
  const { rows } = await db.execute<{ pet_id: number, slug: string, title: string, emoji: string, ends_at: Date }>(sql`
    select * from (
      select distinct on (c.id) c.slug, c.title, c.emoji, c.ends_at, e.pet_id
      from challenges c
      join challenge_entries e on e.challenge_id = c.id
      join photos ph on ph.id = e.photo_id and ph.status = 'approved'
      where c.ends_at <= now()
        and c.id in (select challenge_id from challenge_entries where ${inArray(challengeEntries.petId, petIds)})
      order by c.id, e.wins desc, e.elo desc, e.id
    ) winners
    where ${inArray(sql`pet_id`, petIds)}
    order by ends_at desc`)
  for (const r of rows) {
    const list = trophies.get(r.pet_id) ?? []
    list.push({ slug: r.slug, title: r.title, emoji: r.emoji, endsAt: new Date(r.ends_at).toISOString() })
    trophies.set(r.pet_id, list)
  }
  return trophies
}
