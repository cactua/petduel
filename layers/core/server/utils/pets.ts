import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { PetGallery } from '#shared/models'
import { petBadges } from '#shared/badges'
import { photos, pets, users, type Pet } from '../db/schema'
import { imageUrl, photoCredit, useDb } from './db'
import { loadTrophies } from './challenges'
import { loadAdoptions } from './shelters'

const TZ = 'Europe/Rome'

// Solo i pet con almeno una foto approvata sono visibili al pubblico
export const hasApprovedPhoto = sql`exists (select 1 from ${photos} where ${photos.petId} = ${pets.id} and ${photos.status} = 'approved')`

// In classifiche e sfide entrano tutti, tranne i pet che un rifugio ha scelto di tenere fuori
export const inRankings = sql`not ${pets.hideFromRankings}`
// Pet davanti in classifica di sempre: più cuori, o gli stessi cuori e un Elo (nascosto) più alto
export const aheadOf = (pet: { wins: number, elo: number }) =>
  sql`(${pets.wins} > ${pet.wins} or (${pets.wins} = ${pet.wins} and ${pets.elo} > ${pet.elo}))`

// Foto approvata più recente: copertina in classifica
export const coverImage = sql<string>`(select ${photos.image} from ${photos} where ${photos.petId} = ${pets.id} and ${photos.status} = 'approved' order by ${photos.createdAt} desc limit 1)`

// Nei duelli ogni volta una foto approvata a caso, così tutta la gallery partecipa
export async function randomApprovedImages(petIds: number[]) {
  const db = await useDb()
  const rows = await db.execute<{ id: number, pet_id: number, image: string, credit: string | null, credit_url: string | null }>(sql`
    select distinct on (pet_id) id, pet_id, image, credit, credit_url from ${photos}
    where ${inArray(photos.petId, petIds)} and status = 'approved'
    order by pet_id, random()`)
  return new Map(rows.rows.map(r => [r.pet_id, { photoId: r.id, image: r.image, credit: photoCredit(r.credit, r.credit_url) }]))
}

/** Pet con gallery. `includePrivate`: anche foto in attesa o rifiutate (solo per il proprietario). */
export async function loadGalleries(where: SQL | undefined, includePrivate: boolean): Promise<PetGallery[]> {
  const db = await useDb()
  const petRows = await db.select().from(pets)
    .where(includePrivate ? where : and(where, hasApprovedPhoto))
    .orderBy(asc(pets.createdAt))
  if (!petRows.length) return []

  const petIds = petRows.map(p => p.id)
  const ownerIds = [...new Set(petRows.map(p => p.ownerId))]
  const [photoRows, owners, trophies, adoptions, badgeStats] = await Promise.all([
    db.select().from(photos)
      .where(and(inArray(photos.petId, petIds), includePrivate ? undefined : eq(photos.status, 'approved')))
      .orderBy(desc(photos.createdAt)),
    db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, ownerIds)),
    loadTrophies(petIds),
    loadAdoptions(petIds),
    loadBadgeStats(petIds),
  ])
  const ownerName = new Map(owners.map(o => [o.id, o.username]))

  return petRows.map(pet => ({
    ...publicStats(pet),
    // I cuori solo a chi guarda i propri pet: agli altri non arriva nemmeno il numero
    ...(includePrivate ? { wins: pet.wins } : {}),
    owner: ownerName.get(pet.ownerId) ?? '',
    trophies: trophies.get(pet.id) ?? [],
    badges: petBadges({
      hearts: pet.wins,
      approvedPhotos: photoRows.filter(ph => ph.petId === pet.id && ph.status === 'approved').length,
      challenges: badgeStats.get(pet.id)?.challenges ?? 0,
      weeksFirst: badgeStats.get(pet.id)?.weeksFirst ?? 0,
      adopted: pet.adoption === 'adopted',
    }),
    adoptionInfo: adoptions.get(pet.id) ?? null,
    photos: photoRows.filter(ph => ph.petId === pet.id).map(ph => ({
      id: ph.id,
      // Il file di una foto rifiutata viene cancellato: resta solo il motivo
      image: ph.status === 'rejected' ? '' : imageUrl(ph.image),
      status: ph.status,
      rejectReason: ph.rejectReason,
      credit: photoCredit(ph.credit, ph.creditUrl),
      createdAt: ph.createdAt.toISOString(),
    })),
  }))
}

/**
 * Per i traguardi: sfide a cui ha partecipato e settimane concluse al primo posto della sua specie
 * (stesso ordine della classifica settimanale: cuori ricevuti, a pari cuori l'Elo nascosto)
 */
async function loadBadgeStats(petIds: number[]) {
  const db = await useDb()
  const ids = sql.join(petIds.map(id => sql`${id}`), sql`, `)
  const { rows } = await db.execute<{ pet_id: number, challenges: number, weeks_first: number }>(sql`
    with weekly as (
      select date_trunc('week', v.created_at at time zone ${TZ}) as week, p.species, v.winner_id as pet_id, p.elo, count(*) as n
      from votes v join pets p on p.id = v.winner_id
      where v.delta > 0 and not p.hide_from_rankings
        and v.created_at < date_trunc('week', now() at time zone ${TZ}) at time zone ${TZ}
        and p.species in (select species from pets where id in (${ids}))
      group by 1, 2, 3, 4
    ),
    firsts as (
      select pet_id, count(*)::int as weeks_first from (
        select pet_id, row_number() over (partition by week, species order by n desc, elo desc, pet_id) as r from weekly
      ) w where r = 1 group by pet_id
    ),
    entries as (
      select pet_id, count(*)::int as challenges from challenge_entries where pet_id in (${ids}) group by pet_id
    )
    select p.id as pet_id, coalesce(e.challenges, 0) as challenges, coalesce(f.weeks_first, 0) as weeks_first
    from pets p left join entries e on e.pet_id = p.id left join firsts f on f.pet_id = p.id
    where p.id in (${ids})`)
  return new Map(rows.map(r => [r.pet_id, { challenges: r.challenges, weeksFirst: r.weeks_first }]))
}

function publicStats(pet: Pet) {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    city: pet.city,
    adoption: pet.adoption,
  }
}
