import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { adminUserPatchSchema } from '#shared/models'
import { users } from '../../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Ruolo, sospensione e nuova password. Su se stessi non si può togliere il ruolo né sospendersi
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, adminUserPatchSchema.parse)
  if (id === admin.id && (body.role === 'user' || body.banned)) {
    throw createError({ statusCode: 400, statusMessage: 'errors.cannotSelf' })
  }
  const set: Partial<typeof users.$inferInsert> = {}
  if (body.role) set.role = body.role
  if (body.banned !== undefined) set.bannedAt = body.banned ? new Date() : null
  if (body.password) set.passwordHash = await hashPassword(body.password)
  if (!Object.keys(set).length) return { ok: true }

  const db = await useDb()
  const [user] = await db.update(users).set(set).where(eq(users.id, id)).returning({ id: users.id })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  return { ok: true }
})
