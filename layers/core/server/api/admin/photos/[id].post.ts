import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { challengeEntries, challenges, photos, pets } from '../../../db/schema'
import { REJECT_REASONS } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.enum(REJECT_REASONS) }),
  // Toglie una foto già approvata (segnalazione, errore di moderazione)
  z.object({ action: z.literal('remove'), reason: z.enum(REJECT_REASONS) }),
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  const db = await useDb()
  const [photo] = await db.update(photos)
    .set({
      status: body.action === 'approve' ? 'approved' : 'rejected',
      rejectReason: body.action === 'approve' ? null : body.reason,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(and(eq(photos.id, id), eq(photos.status, body.action === 'remove' ? 'approved' : 'pending')))
    .returning({ image: photos.image, petId: photos.petId })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoAlreadyModerated' })

  // Una foto rifiutata non deve restare da nessuna parte
  if (body.action !== 'approve') await removeImage(photo.image)

  // Avviso al proprietario; se la foto era l'iscrizione a una sfida, lo si dice
  const [info] = await db.select({ ownerId: pets.ownerId, name: pets.name, challenge: challenges.title, slug: challenges.slug })
    .from(pets)
    .leftJoin(challengeEntries, eq(challengeEntries.photoId, id))
    .leftJoin(challenges, eq(challenges.id, challengeEntries.challengeId))
    .where(eq(pets.id, photo.petId))
  if (info) {
    const text = `notif.${{ approve: 'photoApproved', remove: 'photoRemoved', reject: 'photoRejected' }[body.action]}${info.challenge ? 'Challenge' : ''}`
    const params = { name: info.name, reason: 'reason' in body ? body.reason : '', ...(info.challenge && info.slug ? { challenge: info.challenge, challengeSlug: info.slug } : {}) }
    await notify(info.ownerId, `${body.action === 'remove' ? 'foto-rimossa' : 'foto'}:${id}`, body.action === 'approve'
      ? { emoji: '✅', text, params, link: info.slug ? `/sfide/${info.slug}` : `/pet/${photo.petId}` }
      : { emoji: '🚫', text, params, link: `/pet/${photo.petId}` })
  }
  return { ok: true }
})
