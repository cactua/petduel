import { eq } from 'drizzle-orm'
import { shelters } from '@core/server/db/schema'
import { shelterFieldsSchema } from '#shared/models'

// Richiesta di verifica di un rifugio: resta in attesa finché un moderatore non la controlla.
// Dopo un rifiuto si può correggere e inviare di nuovo.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const parsed = shelterFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const existing = await shelterOfUser(user.id)
  if (existing?.status === 'pending') throw createError({ statusCode: 409, statusMessage: 'errors.shelterPending' })
  if (existing?.status === 'approved') throw createError({ statusCode: 409, statusMessage: 'errors.shelterAlreadyVerified' })

  const db = await useDb()
  const values = { ...parsed.data, slug: await uniqueShelterSlug(parsed.data.name, existing?.id), status: 'pending' as const, rejectReason: null }
  if (existing) await db.update(shelters).set({ ...values, createdAt: new Date() }).where(eq(shelters.id, existing.id))
  else await db.insert(shelters).values({ ...values, userId: user.id })
  return { ok: true }
})
