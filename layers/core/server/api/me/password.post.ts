import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'
import { passwordSchema } from '#shared/models'

const bodySchema = z.object({ current: z.string().min(1).max(200), password: passwordSchema })

// Cambia la password, dopo aver confermato quella attuale. Gli altri dispositivi vengono disconnessi
export default defineEventHandler(async (event) => {
  const session = await requireUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const { current, password } = parsed.data

  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.id))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  await confirmPassword(user, current)
  if (password.toLowerCase().includes(user.username) || password.toLowerCase() === user.email) {
    throw createError({ statusCode: 400, statusMessage: 'errors.passwordContainsName' })
  }

  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id))
  await revokeOtherSessions(event, user.id)
  return { ok: true }
})
