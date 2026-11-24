import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../../db/schema'

const bodySchema = z.object({ code: z.string().trim().min(6).max(10) })

// Secondo passo: il codice dell'app conferma che il segreto è stato salvato bene. Si attiva, si mostrano
// una volta sola i codici di emergenza e le altre sessioni si chiudono (devono rientrare con il codice)
export default defineEventHandler(async (event) => {
  const user = await loadFullUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'errors.wrongCode' })
  if (user.totpEnabledAt) throw createError({ statusCode: 409, statusMessage: 'errors.totpAlreadyOn' })
  if (!user.totpPendingSecret) throw createError({ statusCode: 400, statusMessage: 'errors.totpNoSetup' })

  const key = `totp:${user.id}`
  if (await peekLimit(key) >= 8) throw createError({ statusCode: 429, statusMessage: 'errors.tooManyLogins' })
  const secret = openTotpSecret(user.totpPendingSecret, totpKey())
  const step = verifyTotp(secret, parsed.data.code, null)
  if (step === null) {
    await hitLimit(key, 15 * 60 * 1000)
    throw createError({ statusCode: 403, statusMessage: 'errors.wrongCode' })
  }
  await clearLimit(key)

  const codes = generateRecoveryCodes()
  const db = await useDb()
  await db.update(users).set({
    totpSecret: user.totpPendingSecret,
    totpPendingSecret: null,
    totpEnabledAt: new Date(),
    totpLastStep: step,
    totpRecovery: codes.map(hashRecoveryCode),
  }).where(eq(users.id, user.id))
  await revokeOtherSessions(event, user.id)
  return { recoveryCodes: codes }
})
