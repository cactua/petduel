import { randomUUID } from 'node:crypto'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { adEvents, adNetworkViews, adoptionRequests, blocks, challengeEntries, challengeVotes, challenges, compliments, favorites, follows, notifications, pets, photos, reports, shelters, users, votes } from '../db/schema'
import { imageUrl, useDb } from './db'
import { removeImage } from './photos'
import { removeShelterImage } from './shelterImages'

/**
 * Elimina un account: profilo, pet, foto (anche i file), rifugio, richieste di adozione e avvisi.
 * I voti dati e gli eventi degli annunci restano per non falsare classifiche e statistiche,
 * ma passano a un codice casuale: non resta nessun legame con la persona.
 */
export async function deleteAccount(userId: number) {
  const db = await useDb()
  const petIds = (await db.select({ id: pets.id }).from(pets).where(eq(pets.ownerId, userId))).map(p => p.id)
  const files = petIds.length ? await db.select({ image: photos.image }).from(photos).where(inArray(photos.petId, petIds)) : []

  const [shelterImages] = await db.select({ logo: shelters.logo, banner: shelters.banner }).from(shelters).where(eq(shelters.userId, userId))
  const deleted = await db.transaction(async (tx) => {
    const was = `u:${userId}`
    const anon = `d:${randomUUID()}`
    await tx.update(votes).set({ voterId: anon }).where(eq(votes.voterId, was))
    await tx.update(challengeVotes).set({ voterId: anon }).where(eq(challengeVotes.voterId, was))
    await tx.update(adEvents).set({ voterId: anon }).where(eq(adEvents.voterId, was))
    await tx.update(adNetworkViews).set({ voterId: anon }).where(eq(adNetworkViews.voterId, was))
    // Disegni di altri dove era indicato come artista: il disegno resta, il suo nome no
    await tx.update(photos).set({ credit: null, creditUrl: null, artistId: null }).where(eq(photos.artistId, userId))
    // Il resto se ne va a cascata con l'utente (pet, foto, rifugio, richieste, avvisi)
    return tx.delete(users).where(eq(users.id, userId)).returning({ id: users.id })
  })
  if (!deleted.length) return false
  await Promise.all([
    ...files.map(f => removeImage(f.image)),
    removeShelterImage(shelterImages?.logo ?? null, 'logo'),
    removeShelterImage(shelterImages?.banner ?? null, 'banner'),
  ])
  return true
}

/** Tutti i dati di una persona, leggibili, per il diritto di accesso e portabilità */
export async function exportAccount(userId: number) {
  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) return null
  const voter = `u:${userId}`
  const myPets = await db.select().from(pets).where(eq(pets.ownerId, userId))
  const petIds = myPets.map(p => p.id)
  const [myPhotos, entries, [shelter], requests, notes, myVotes, myChallengeVotes] = await Promise.all([
    petIds.length ? db.select().from(photos).where(inArray(photos.petId, petIds)) : [],
    petIds.length
      ? db.select({ entry: challengeEntries, challenge: challenges.title }).from(challengeEntries)
          .innerJoin(challenges, eq(challenges.id, challengeEntries.challengeId)).where(inArray(challengeEntries.petId, petIds))
      : [],
    db.select().from(shelters).where(eq(shelters.userId, userId)),
    db.select({ r: adoptionRequests, pet: pets.name }).from(adoptionRequests)
      .innerJoin(pets, eq(pets.id, adoptionRequests.petId)).where(eq(adoptionRequests.userId, userId)),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),
    db.select({ winnerId: votes.winnerId, loserId: votes.loserId, at: votes.createdAt }).from(votes)
      .where(eq(votes.voterId, voter)).orderBy(desc(votes.createdAt)),
    db.select({ challengeId: challengeVotes.challengeId, winnerId: challengeVotes.winnerId, loserId: challengeVotes.loserId, at: challengeVotes.createdAt })
      .from(challengeVotes).where(eq(challengeVotes.voterId, voter)).orderBy(desc(challengeVotes.createdAt)),
  ])
  // Richieste ricevute dal proprio rifugio: solo quante, perché contengono dati di altre persone
  const [received] = shelter
    ? await db.select({ n: sql<number>`count(*)::int` }).from(adoptionRequests).where(and(eq(adoptionRequests.shelterId, shelter.id)))
    : []

  return {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, username: user.username, role: user.role, createdAt: user.createdAt },
    artist: user.isArtist ? { links: user.artistLinks, commissions: user.commissions, commissionsUrl: user.commissionsUrl } : null,
    rulesAcceptedAt: user.rulesAcceptedAt,
    blocked: (await db.select({ username: users.username }).from(blocks).innerJoin(users, eq(users.id, blocks.blockedId))
      .where(eq(blocks.blockerId, userId))).map(b => b.username),
    following: (await db.select({ username: users.username }).from(follows).innerJoin(users, eq(users.id, follows.followedId))
      .where(eq(follows.followerId, userId))).map(f => f.username),
    favorites: await db.select({ petId: pets.id, pet: pets.name, at: favorites.createdAt }).from(favorites)
      .innerJoin(pets, eq(pets.id, favorites.petId)).where(eq(favorites.userId, userId)),
    complimentsGiven: await db.select({ pet: pets.name, kind: compliments.kind, at: compliments.createdAt }).from(compliments)
      .innerJoin(pets, eq(pets.id, compliments.petId)).where(eq(compliments.userId, userId)),
    reportsSent: await db.select({ reason: reports.reason, note: reports.note, status: reports.status, at: reports.createdAt }).from(reports)
      .where(eq(reports.reporterId, userId)),
    pets: myPets.map(p => ({
      id: p.id, name: p.name, species: p.species, breed: p.breed, city: p.city, hearts: p.wins, createdAt: p.createdAt,
      adoption: p.adoption ? { status: p.adoption, sex: p.sex, age: p.age, size: p.size, neutered: p.neutered, about: p.about } : null,
      photos: myPhotos.filter(ph => ph.petId === p.id).map(ph => ({
        status: ph.status, url: ph.status === 'rejected' ? null : imageUrl(ph.image), rejectReason: ph.rejectReason, createdAt: ph.createdAt,
      })),
      challenges: entries.filter(e => e.entry.petId === p.id).map(e => ({ challenge: e.challenge, hearts: e.entry.wins, joinedAt: e.entry.createdAt })),
    })),
    shelter: shelter
      ? {
          name: shelter.name, city: shelter.city, description: shelter.description, website: shelter.website,
          taxCode: shelter.taxCode, contactEmail: shelter.contactEmail, phone: shelter.phone, status: shelter.status,
          createdAt: shelter.createdAt, adoptionRequestsReceived: received?.n ?? 0,
        }
      : null,
    adoptionRequestsSent: requests.map(({ r, pet }) => ({ pet, message: r.message, phone: r.phone, status: r.status, createdAt: r.createdAt })),
    votes: myVotes,
    challengeVotes: myChallengeVotes,
    notifications: notes.map(n => ({ text: n.text, params: n.params ? JSON.parse(n.params) : null, readAt: n.readAt, createdAt: n.createdAt })),
  }
}
