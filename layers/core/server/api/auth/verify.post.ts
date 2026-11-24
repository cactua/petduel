import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'

const bodySchema = z.object({ token: z.string().max(200) })

// Conferma dell'email dal link ricevuto. Vale anche senza essere collegati (link aperto su un altro dispositivo)
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'errors.linkExpired' })
  const userId = await consumeEmailToken(parsed.data.token, 'verify')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'errors.linkExpired' })
  const db = await useDb()
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, userId), isNull(users.emailVerifiedAt)))
  return { ok: true }
})
