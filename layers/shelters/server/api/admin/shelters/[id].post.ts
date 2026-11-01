import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets, shelters } from '@core/server/db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const reason = z.string().trim().min(3, 'Scrivi il motivo').max(200)
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason }),
  // Toglie la verifica a un rifugio già approvato
  z.object({ action: z.literal('revoke'), reason }),
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const body = parsed.data

  const db = await useDb()
  const [shelter] = await db.update(shelters)
    .set({
      status: body.action === 'approve' ? 'approved' : 'rejected',
      rejectReason: body.action === 'approve' ? null : body.reason,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(and(eq(shelters.id, id), eq(shelters.status, body.action === 'revoke' ? 'approved' : 'pending')))
    .returning({ userId: shelters.userId })
  if (!shelter) throw createError({ statusCode: 404, statusMessage: 'errors.shelterAlreadyReviewed' })

  // Senza verifica i suoi pet tornano pet normali: niente più "Cerca casa"
  if (body.action === 'revoke') await db.update(pets).set({ adoption: null, hideFromRankings: false }).where(eq(pets.ownerId, shelter.userId))
  return { ok: true }
})
