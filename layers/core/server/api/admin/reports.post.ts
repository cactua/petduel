import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'
import { REJECT_REASONS } from '#shared/models'

const bodySchema = z.discriminatedUnion('action', [
  // Niente da fare: si chiudono le segnalazioni
  z.object({ action: z.literal('dismiss'), target: z.enum(['photo', 'user']), id: z.number().int().positive() }),
  // Toglie l'immagine segnalata, con il motivo che vedrà il proprietario
  z.object({ action: z.literal('remove'), target: z.literal('photo'), id: z.number().int().positive(), reason: z.enum(REJECT_REASONS) }),
  // Sospende il profilo segnalato
  z.object({ action: z.literal('ban'), target: z.literal('user'), id: z.number().int().positive() }),
])

// Decisione su una cosa segnalata: chiude tutte le sue segnalazioni aperte e avvisa chi le aveva fatte (closeReports)
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  if (body.action === 'remove') await moderatePhoto(admin.id, body.id, 'remove', body.reason)
  if (body.action === 'ban') {
    if (body.id === admin.id) throw createError({ statusCode: 400, statusMessage: 'errors.cannotSelf' })
    const [banned] = await db.update(users).set({ bannedAt: new Date() })
      .where(and(eq(users.id, body.id), eq(users.role, 'user'), isNull(users.bannedAt))).returning({ id: users.id })
    if (!banned) throw createError({ statusCode: 400, statusMessage: 'Utente non trovato, già sospeso o admin' })
  }

  // Per "remove" le ha già chiuse moderatePhoto
  if (body.action !== 'remove') await closeReports(admin.id, body.target, body.id, body.action === 'ban' ? 'resolved' : 'dismissed')
  return { ok: true }
})
