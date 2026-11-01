import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { PetAdoption, PublicShelter, ShelterManage, ShelterProfile } from '#shared/models'
import { adoptionRequests, pets, shelters, type Shelter } from '../db/schema'
import { useDb } from './db'
import { hasApprovedPhoto } from './pets'
import { requireUser } from './auth'

// Massimo di richieste di adozione al giorno per persona: frena spam e truffe
export const MAX_REQUESTS_PER_DAY = 5

/** "Rifugio Amici a 4 zampe" -> "rifugio-amici-a-4-zampe" */
export function slugify(text: string, fallback: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || fallback
}

/** Slug libero: se il nome è già preso si aggiunge -2, -3… */
export async function uniqueShelterSlug(name: string, exceptId?: number) {
  const db = await useDb()
  const base = slugify(name, 'rifugio')
  const taken = await db.select({ slug: shelters.slug, id: shelters.id }).from(shelters)
    .where(sql`${shelters.slug} = ${base} or ${shelters.slug} like ${`${base}-%`}`)
  // "me" è la pagina dell'area riservata (/api/shelters/me)
  const used = new Set(['me', ...taken.filter(t => t.id !== exceptId).map(t => t.slug)])
  if (!used.has(base)) return base
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`
}

export async function shelterOfUser(userId: number) {
  const db = await useDb()
  const [row] = await db.select().from(shelters).where(eq(shelters.userId, userId))
  return row ?? null
}

/** Utente collegato che gestisce un rifugio già verificato */
export async function requireShelter(event: H3Event) {
  const user = await requireUser(event)
  const shelter = await shelterOfUser(user.id)
  if (shelter?.status !== 'approved') throw createError({ statusCode: 403, statusMessage: 'errors.verifiedOnly' })
  return { user, shelter }
}

/** Numero di pet in cerca di casa e già adottati per ciascun rifugio */
export async function toPublicShelters(list: Shelter[]): Promise<PublicShelter[]> {
  if (!list.length) return []
  const db = await useDb()
  const counts = await db.select({
    ownerId: pets.ownerId,
    available: sql<number>`count(*) filter (where ${pets.adoption} in ('available', 'fostered'))::int`,
    adopted: sql<number>`count(*) filter (where ${pets.adoption} = 'adopted')::int`,
  }).from(pets)
    .where(and(inArray(pets.ownerId, list.map(s => s.userId)), isNotNull(pets.adoption), hasApprovedPhoto))
    .groupBy(pets.ownerId)
  return list.map((s) => {
    const c = counts.find(x => x.ownerId === s.userId)
    return {
      slug: s.slug,
      name: s.name,
      city: s.city,
      description: s.description,
      tagline: s.tagline,
      website: s.website,
      accent: s.accent,
      logo: s.logo,
      banner: s.banner,
      available: c?.available ?? 0,
      adopted: c?.adopted ?? 0,
    }
  })
}

/** Rifugio gestito da un utente e richieste di adozione ancora da leggere */
export async function shelterManage(userId: number): Promise<ShelterManage | null> {
  const shelter = await shelterOfUser(userId)
  if (!shelter) return null
  const db = await useDb()
  const [row] = shelter.status === 'approved'
    ? await db.select({ n: sql<number>`count(*)::int` }).from(adoptionRequests)
        .where(and(eq(adoptionRequests.shelterId, shelter.id), eq(adoptionRequests.status, 'new')))
    : []
  return { status: shelter.status, slug: shelter.slug, name: shelter.name, newRequests: row?.n ?? 0 }
}

/** Campi del profilo modificabili dal rifugio, come li salva il database */
export function shelterProfile(s: Shelter): ShelterProfile {
  return {
    description: s.description, tagline: s.tagline, help: s.help, needs: s.needs, accent: s.accent,
    address: s.address, lat: s.lat, lng: s.lng, hours: s.hours,
    website: s.website, publicEmail: s.publicEmail, publicPhone: s.publicPhone,
    socials: { instagram: '', facebook: '', tiktok: '', youtube: '', ...s.socials },
    donateUrl: s.donateUrl, iban: s.iban, contactEmail: s.contactEmail, phone: s.phone,
  }
}

/** Scheda di adozione dei pet indicati (solo quelli di un rifugio verificato con uno stato impostato) */
export async function loadAdoptions(petIds: number[]) {
  if (!petIds.length) return new Map<number, PetAdoption>()
  const db = await useDb()
  const rows = await db.select({ pet: pets, shelter: { slug: shelters.slug, name: shelters.name, city: shelters.city } })
    .from(pets)
    .innerJoin(shelters, and(eq(shelters.userId, pets.ownerId), eq(shelters.status, 'approved')))
    .where(and(inArray(pets.id, petIds), isNotNull(pets.adoption)))
  return new Map(rows.map(({ pet, shelter }) => [pet.id, {
    status: pet.adoption!,
    sex: pet.sex,
    age: pet.age,
    size: pet.size,
    neutered: pet.neutered,
    about: pet.about,
    hideFromRankings: pet.hideFromRankings,
    shelter,
  }]))
}
