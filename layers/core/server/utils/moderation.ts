import { and, eq } from 'drizzle-orm'
import { challengeEntries, challenges, photos, pets, reports } from '../db/schema'
import { useDb } from './db'
import { notify } from './notifications'
import { removeImage } from './photos'

export type PhotoAction = 'approve' | 'reject' | 'remove'

/**
 * Decisione di un moderatore su una foto: approva o rifiuta una in attesa, oppure toglie una già approvata
 * (segnalazione, errore di moderazione). Avvisa il proprietario e, se la foto è approvata, l'artista indicato
 */
export async function moderatePhoto(adminId: number, id: number, action: PhotoAction, reason: string | null) {
  const db = await useDb()
  const [photo] = await db.update(photos)
    .set({
      status: action === 'approve' ? 'approved' : 'rejected',
      rejectReason: action === 'approve' ? null : reason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(and(eq(photos.id, id), eq(photos.status, action === 'remove' ? 'approved' : 'pending')))
    .returning({ image: photos.image, petId: photos.petId, artistId: photos.artistId })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoAlreadyModerated' })

  // Una foto rifiutata non deve restare da nessuna parte
  if (action !== 'approve') await removeImage(photo.image)
  // Tolta da qui o dalla coda delle segnalazioni: chi l'aveva segnalata viene avvisato
  if (action === 'remove') await closeReports(adminId, 'photo', id, 'resolved')

  // Avviso al proprietario; se la foto era l'iscrizione a una sfida, lo si dice
  const [info] = await db.select({ ownerId: pets.ownerId, name: pets.name, challenge: challenges.title, slug: challenges.slug })
    .from(pets)
    .leftJoin(challengeEntries, eq(challengeEntries.photoId, id))
    .leftJoin(challenges, eq(challenges.id, challengeEntries.challengeId))
    .where(eq(pets.id, photo.petId))
  if (!info) return
  const text = `notif.${{ approve: 'photoApproved', remove: 'photoRemoved', reject: 'photoRejected' }[action]}${info.challenge ? 'Challenge' : ''}`
  const params = { name: info.name, reason: reason ?? '', ...(info.challenge && info.slug ? { challenge: info.challenge, challengeSlug: info.slug } : {}) }
  await notify(info.ownerId, `${action === 'remove' ? 'foto-rimossa' : 'foto'}:${id}`, action === 'approve'
    ? { emoji: '✅', text, params, link: info.slug ? `/sfide/${info.slug}` : `/pet/${photo.petId}` }
    : { emoji: '🚫', text, params, link: `/pet/${photo.petId}` })

  // L'artista lo scopre solo quando il disegno è pubblico; dal profilo può togliere il suo nome o segnalarlo
  if (action === 'approve' && photo.artistId && photo.artistId !== info.ownerId) {
    await notify(photo.artistId, `artista:${id}`, { emoji: '🎨', text: 'notif.artistTagged', params: { name: info.name }, link: `/pet/${photo.petId}` })
  }
}

/**
 * Chiude le segnalazioni aperte su una foto o un profilo e avvisa chi le aveva fatte,
 * senza dettagli su cosa è successo all'altra persona
 */
export async function closeReports(adminId: number, target: 'photo' | 'user', id: number, outcome: 'resolved' | 'dismissed') {
  const db = await useDb()
  const closed = await db.update(reports)
    .set({ status: outcome, resolvedBy: adminId, resolvedAt: new Date() })
    .where(and(eq(reports.status, 'open'), target === 'photo' ? eq(reports.photoId, id) : eq(reports.userId, id)))
    .returning({ id: reports.id, reporterId: reports.reporterId })
  await Promise.all(closed.map(r => notify(r.reporterId, `segnalazione:${r.id}`, {
    emoji: '🛡️', text: outcome === 'resolved' ? 'notif.reportResolved' : 'notif.reportDismissed', params: {},
  })))
  return closed.length
}
