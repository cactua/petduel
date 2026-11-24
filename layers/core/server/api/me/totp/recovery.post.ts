import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../../db/schema'

const bodySchema = z.object({ code: z.string().trim().min(6).max(20) })

// Codici di emergenza nuovi (quelli vecchi non valgono più), dopo un codice dell'app
export default defineEventHandler(async (event) => {
  const user = await loadFullUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'errors.wrongCode' })
  if (!user.totpEnabledAt) throw createError({ statusCode: 400, statusMessage: 'errors.totpNoSetup' })
  await requireSecondFactor(user, parsed.data.code)

  const codes = generateRecoveryCodes()
  const db = await useDb()
  await db.update(users).set({ totpRecovery: codes.map(hashRecoveryCode) }).where(eq(users.id, user.id))
  return { recoveryCodes: codes }
})
