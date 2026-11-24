import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'

const bodySchema = z.object({ locale: z.string().max(5).optional() })
const MAX_PER_HOUR = 3

// Manda di nuovo il link per confermare l'email (pochi all'ora: non serve a mandare email a raffica)
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const body = bodySchema.safeParse(await readBody(event).catch(() => ({})) ?? {})
  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.id))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  if (user.emailVerifiedAt) return { ok: true, verified: true }
  if (await hitLimit(`verify-email:${user.id}`, 60 * 60 * 1000) > MAX_PER_HOUR) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManyRequests' })
  }
  const sent = await sendVerifyEmail(event, user, mailLocale(body.success ? body.data.locale : undefined))
  if (!sent) throw createError({ statusCode: 503, statusMessage: 'errors.mailUnavailable' })
  return { ok: true, verified: false }
})
