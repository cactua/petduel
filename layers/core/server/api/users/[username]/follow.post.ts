import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { follows, users } from '../../../db/schema'
import { usernameSchema } from '#shared/models'

const paramsSchema = z.object({ username: usernameSchema })
const bodySchema = z.object({ following: z.boolean() })

// Segue o smette di seguire un utente: i suoi lavori nuovi finiscono in /following. Non si può se uno dei due ha bloccato l'altro
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { username } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { following } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (!target) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  if (target.id === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.cannotSelf' })
  if (following) {
    if (await isBlockedBetween(user.id, target.id)) throw createError({ statusCode: 403, statusMessage: 'errors.blocked' })
    await db.insert(follows).values({ followerId: user.id, followedId: target.id }).onConflictDoNothing()
  }
  else {
    await db.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followedId, target.id)))
  }
  return { following }
})
