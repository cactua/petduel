import { and, asc, eq, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { pets, photos, reports, users } from '../../db/schema'
import type { ReportGroup } from '#shared/models'

// Coda delle segnalazioni aperte, una voce per cosa segnalata (prima quelle segnalate da più tempo)
export default defineEventHandler(async (event): Promise<ReportGroup[]> => {
  await requireAdmin(event)
  const db = await useDb()
  const reporter = alias(users, 'reporter')
  const rows = await db.select({ r: reports, reporter: reporter.username })
    .from(reports).innerJoin(reporter, eq(reporter.id, reports.reporterId))
    .where(eq(reports.status, 'open')).orderBy(asc(reports.createdAt)).limit(500)

  const photoIds = [...new Set(rows.flatMap(x => (x.r.photoId ? [x.r.photoId] : [])))]
  const userIds = [...new Set(rows.flatMap(x => (x.r.userId ? [x.r.userId] : [])))]
  const owner = alias(users, 'owner')
  const [photoRows, userRows] = await Promise.all([
    photoIds.length
      ? db.select({ id: photos.id, image: photos.image, petId: pets.id, petName: pets.name, owner: owner.username, credit: photos.credit, creditUrl: photos.creditUrl, artistId: photos.artistId })
          .from(photos).innerJoin(pets, eq(pets.id, photos.petId)).innerJoin(owner, eq(owner.id, pets.ownerId))
          .where(and(inArray(photos.id, photoIds), eq(photos.status, 'approved')))
      : [],
    userIds.length
      ? db.select({ id: users.id, username: users.username, bannedAt: users.bannedAt, artistLinks: users.artistLinks }).from(users).where(inArray(users.id, userIds))
      : [],
  ])
  const photoById = new Map(photoRows.map(p => [p.id, p]))
  const userById = new Map(userRows.map(u => [u.id, u]))

  const groups = new Map<string, ReportGroup>()
  for (const { r, reporter: by } of rows) {
    const key = r.photoId ? `p${r.photoId}` : `u${r.userId}`
    let group = groups.get(key)
    if (!group) {
      const p = r.photoId ? photoById.get(r.photoId) : undefined
      const u = r.userId ? userById.get(r.userId) : undefined
      // Foto già tolta per altre vie: la segnalazione non ha più niente da mostrare
      if (r.photoId && !p) continue
      group = {
        target: r.photoId ? 'photo' : 'user',
        id: (r.photoId ?? r.userId)!,
        photo: p ? { image: imageUrl(p.image), petId: p.petId, petName: p.petName, owner: p.owner, credit: photoCredit(p.credit, p.creditUrl) } : null,
        user: u ? { username: u.username, banned: !!u.bannedAt, artistLinks: u.artistLinks } : null,
        reports: [],
      }
      groups.set(key, group)
    }
    const artistId = r.photoId ? photoById.get(r.photoId)?.artistId : null
    group.reports.push({ reason: r.reason, note: r.note, reporter: by, createdAt: r.createdAt.toISOString(), byArtist: !!artistId && artistId === r.reporterId })
  }
  // Prima ciò che l'artista stesso dice di non aver autorizzato, poi le cose segnalate da più persone
  return [...groups.values()].sort((a, b) =>
    Number(b.reports.some(x => x.byArtist)) - Number(a.reports.some(x => x.byArtist)) || b.reports.length - a.reports.length)
})
