import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { blocks, users } from '../../../db/schema'
import { usernameSchema } from '#shared/models'

const paramsSchema = z.object({ username: usernameSchema })
const bodySchema = z.object({ blocked: z.boolean() })

// Blocca o sblocca un utente. Nessuno viene avvisato
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { username } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { blocked } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (!target) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  if (target.id === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.cannotSelf' })
  if (blocked) await db.insert(blocks).values({ blockerId: user.id, blockedId: target.id }).onConflictDoNothing()
  else await db.delete(blocks).where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, target.id)))
  return { blocked }
})
