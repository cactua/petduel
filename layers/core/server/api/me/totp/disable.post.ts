import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../../db/schema'

const bodySchema = z.object({ password: z.string().min(1).max(200), code: z.string().trim().min(6).max(20) })

// Spegne la verifica: servono password e codice (o uno di emergenza). Le altre sessioni si chiudono.
// Un admin può spegnerla, ma poi il pannello non si apre finché non la riattiva
export default defineEventHandler(async (event) => {
  const user = await loadFullUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  if (!user.totpEnabledAt) return { ok: true }
  await confirmPassword(user, parsed.data.password)
  await requireSecondFactor(user, parsed.data.code)

  const db = await useDb()
  await db.update(users).set({ totpSecret: null, totpPendingSecret: null, totpEnabledAt: null, totpLastStep: null, totpRecovery: [] })
    .where(eq(users.id, user.id))
  await revokeOtherSessions(event, user.id)
  return { ok: true }
})
