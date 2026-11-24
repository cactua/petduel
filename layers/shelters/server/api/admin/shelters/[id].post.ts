import { and, eq, isNotNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { pets, shelters } from '@core/server/db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const reason = z.string().trim().min(3, 'Scrivi il motivo').max(200)
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason }),
  // Toglie la verifica a un rifugio già approvato
  z.object({ action: z.literal('revoke'), reason }),
  // Link per le donazioni e IBAN cambiati da un rifugio già verificato
  // Con i valori che il moderatore ha visto: se nel frattempo il rifugio li ha cambiati, non vale
  z.object({ action: z.literal('approvePayment'), pendingIban: z.string().max(60).nullable(), pendingDonateUrl: z.string().max(300).nullable() }),
  z.object({ action: z.literal('rejectPayment') }),
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const body = parsed.data

  const db = await useDb()
  if (body.action === 'approvePayment' || body.action === 'rejectPayment') {
    const [row] = await db.select().from(shelters).where(and(
      eq(shelters.id, id), eq(shelters.status, 'approved'),
      or(isNotNull(shelters.pendingIban), isNotNull(shelters.pendingDonateUrl)),
    ))
    if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.shelterAlreadyReviewed' })
    const approve = body.action === 'approvePayment'
    if (approve && (row.pendingIban !== body.pendingIban || row.pendingDonateUrl !== body.pendingDonateUrl)) {
      throw createError({ statusCode: 409, statusMessage: 'Il rifugio ha cambiato di nuovo i dati: ricarica la pagina' })
    }
    await db.update(shelters).set({
      ...(approve && row.pendingIban !== null ? { iban: row.pendingIban } : {}),
      ...(approve && row.pendingDonateUrl !== null ? { donateUrl: row.pendingDonateUrl } : {}),
      pendingIban: null,
      pendingDonateUrl: null,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    }).where(and(
      eq(shelters.id, id),
      sql`${shelters.pendingIban} is not distinct from ${row.pendingIban}`,
      sql`${shelters.pendingDonateUrl} is not distinct from ${row.pendingDonateUrl}`,
    ))
    await notify(row.userId, `donazioni:${row.id}:${Date.now()}`, {
      emoji: approve ? '✅' : '⚠️',
      text: approve ? 'notif.paymentApproved' : 'notif.paymentRejected',
      params: { name: row.name },
      link: approve ? `/shelters/${row.slug}` : '/my-shelter',
    })
    return { ok: true }
  }

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
