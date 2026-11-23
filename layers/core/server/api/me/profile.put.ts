import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { profileAboutSchema } from '#shared/models'

// Bio e pronomi mostrati sul proprio profilo
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b => profileAboutSchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: body.error.issues[0]?.message ?? 'validation.check' })
  const db = await useDb()
  await db.update(users).set(body.data).where(eq(users.id, user.id))
  return body.data
})
