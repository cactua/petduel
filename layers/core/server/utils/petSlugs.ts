import { and, asc, eq, ne } from 'drizzle-orm'
import { entrySlug } from '#shared/models'
import { petOldSlugs, pets, users } from '../db/schema'
import { useDb } from './db'

// Indirizzi con il nome: /u/<proprietario>/<nome> (entryUrl in shared/models.ts).
// Il nome nell'indirizzo si ricava ogni volta dal nome del partecipante, quindi non c'è una colonna da tenere allineata

/**
 * Il partecipante di un utente con quel nome nell'indirizzo. Prima i nomi in uso, poi quelli di prima di una rinomina.
 * Se due partecipanti avessero lo stesso nome (creati prima del controllo), vale il più vecchio
 */
export async function findPetBySlug(username: string, slug: string) {
  const db = await useDb()
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.username, username.toLowerCase()))
  if (!owner) return null
  const own = await db.select({ id: pets.id, name: pets.name }).from(pets).where(eq(pets.ownerId, owner.id)).orderBy(asc(pets.id))
  const current = own.find(p => entrySlug(p.name) === slug)
  if (current) return current
  const [old] = await db.select({ id: pets.id, name: pets.name }).from(petOldSlugs)
    .innerJoin(pets, eq(pets.id, petOldSlugs.petId))
    .where(and(eq(petOldSlugs.ownerId, owner.id), eq(petOldSlugs.slug, slug)))
  return old ?? null
}

/** Ferma chi dà a un partecipante un nome che, nell'indirizzo, è uguale a quello di un altro suo partecipante */
export async function assertPetNameFree(ownerId: number, name: string, exceptPetId?: number) {
  const db = await useDb()
  const others = await db.select({ name: pets.name }).from(pets)
    .where(exceptPetId ? and(eq(pets.ownerId, ownerId), ne(pets.id, exceptPetId)) : eq(pets.ownerId, ownerId))
  const slug = entrySlug(name)
  if (others.some(p => entrySlug(p.name) === slug)) {
    throw createError({ statusCode: 409, statusMessage: 'errors.petNameTaken' })
  }
}

/**
 * Dopo una rinomina il vecchio indirizzo resta valido: si ricorda il nome di prima.
 * Se lo stesso nome torna in uso (rinomina all'indietro, o un altro partecipante) vince comunque quello in uso
 */
export async function rememberOldSlug(ownerId: number, petId: number, oldName: string, newName: string) {
  const before = entrySlug(oldName)
  if (before === entrySlug(newName)) return
  const db = await useDb()
  await db.insert(petOldSlugs).values({ ownerId, slug: before, petId })
    .onConflictDoUpdate({ target: [petOldSlugs.ownerId, petOldSlugs.slug], set: { petId } })
}
