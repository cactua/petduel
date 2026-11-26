import { and, eq, inArray, sql } from 'drizzle-orm'
import { SITE_SETTINGS_DEFAULT, siteSettingsSchema, type SiteLimits, type SiteSettings } from '#shared/models'
import { photos, pets, settings, shelters } from '../db/schema'

// Impostazioni generali del sito, salvate nella tabella settings sotto "site".
// I campi mancanti prendono il valore predefinito, così un'impostazione nuova vale anche per i siti già avviati

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await useDb()
  const [row] = await db.select().from(settings).where(eq(settings.key, 'site'))
  if (!row) return { ...SITE_SETTINGS_DEFAULT }
  let saved: unknown
  try {
    saved = JSON.parse(row.value)
  }
  catch {
    return { ...SITE_SETTINGS_DEFAULT }
  }
  const parsed = siteSettingsSchema.safeParse({ ...SITE_SETTINGS_DEFAULT, ...(saved as object) })
  return parsed.success ? parsed.data : { ...SITE_SETTINGS_DEFAULT }
}

export async function saveSiteSettings(value: SiteSettings) {
  const db = await useDb()
  const json = JSON.stringify(value)
  await db.insert(settings).values({ key: 'site', value: json })
    .onConflictDoUpdate({ target: settings.key, set: { value: json } })
}

/** Cosa è cambiato, per il registro: [{ key, from, to }] */
export function settingsChanges(before: SiteSettings, after: SiteSettings) {
  return (Object.keys(after) as (keyof SiteSettings)[])
    .filter(k => before[k] !== after[k])
    .map(k => ({ key: k, from: before[k], to: after[k] }))
}

type LimitUser = { id: number, role: string }

/** Admin e rifugi approvati non hanno limiti: un rifugio ospita tanti animali */
export async function isLimitExempt(user: LimitUser) {
  if (user.role === 'admin') return true
  const db = await useDb()
  const [row] = await db.select({ id: shelters.id }).from(shelters)
    .where(and(eq(shelters.userId, user.id), eq(shelters.status, 'approved')))
  return !!row
}

export async function getSiteLimits(user: LimitUser | null): Promise<SiteLimits> {
  const s = await getSiteSettings()
  return {
    maxPetsPerUser: s.maxPetsPerUser,
    maxPhotosPerPet: s.maxPhotosPerPet,
    uploadsOpen: s.uploadsOpen,
    signupsOpen: s.signupsOpen,
    exempt: user ? await isLimitExempt(user) : false,
  }
}

/** Caricamenti chiusi dall'admin: nessuna immagine nuova (gli admin possono sempre) */
export async function assertUploadsOpen(user: LimitUser) {
  const s = await getSiteSettings()
  if (!s.uploadsOpen && user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'errors.uploadsClosed' })
}

/** Limite di voci (personaggi, pet, moto...) per utente */
export async function assertCanCreatePet(user: LimitUser) {
  const { maxPetsPerUser: max } = await getSiteSettings()
  if (max === null || await isLimitExempt(user)) return
  const db = await useDb()
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(pets).where(eq(pets.ownerId, user.id))
  if ((row?.n ?? 0) >= max) throw createError({ statusCode: 403, statusMessage: 'errors.petLimit', data: { params: { n: max } } })
}

/** Limite di immagini per voce: contano quelle in attesa e approvate, non le rifiutate */
export async function assertCanAddPhoto(user: LimitUser, petId: number) {
  const { maxPhotosPerPet: max } = await getSiteSettings()
  if (max === null || await isLimitExempt(user)) return
  const db = await useDb()
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(photos)
    .where(and(eq(photos.petId, petId), inArray(photos.status, ['pending', 'approved'])))
  if ((row?.n ?? 0) >= max) throw createError({ statusCode: 403, statusMessage: 'errors.photoLimit', data: { params: { n: max } } })
}
