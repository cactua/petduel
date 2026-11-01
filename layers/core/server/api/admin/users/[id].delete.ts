import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Elimina l'account con pet, foto (anche i file) e rifugio. I voti dati restano, anonimi
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  if (id === admin.id) throw createError({ statusCode: 400, statusMessage: 'errors.cannotDeleteSelf' })
  if (!await deleteAccount(id)) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  return { ok: true }
})
