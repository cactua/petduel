import { z } from 'zod'
import { REJECT_REASONS } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.enum(REJECT_REASONS) }),
  // Toglie una foto già approvata (segnalazione, errore di moderazione)
  z.object({ action: z.literal('remove'), reason: z.enum(REJECT_REASONS) }),
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)
  await moderatePhoto(admin.id, id, body.action, 'reason' in body ? body.reason : null)
  return { ok: true }
})
