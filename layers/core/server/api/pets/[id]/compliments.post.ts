import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { compliments, photos } from '../../../db/schema'
import { COMPLIMENTS } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
const bodySchema = z.object({ kind: z.enum(COMPLIMENTS), on: z.boolean() })

// Fa o ritira un complimento. Proprietario e artista ricevono al massimo un avviso al giorno per partecipante
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { kind, on } = await readValidatedBody(event, bodySchema.parse)
  const readers = await complimentReaders(id)
  if (!readers) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  if (readers.ownerId === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.cannotSelf' })

  const db = await useDb()
  if (!on) {
    await db.delete(compliments).where(and(eq(compliments.petId, id), eq(compliments.userId, user.id), eq(compliments.kind, kind)))
    return { ok: true }
  }
  const [approved] = await db.select({ n: count() }).from(photos).where(and(eq(photos.petId, id), eq(photos.status, 'approved')))
  if (!approved?.n) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  if (await isBlockedBetween(user.id, readers.ownerId)) throw createError({ statusCode: 403, statusMessage: 'errors.blocked' })

  const [added] = await db.insert(compliments).values({ petId: id, userId: user.id, kind }).onConflictDoNothing().returning({ id: compliments.id })
  if (added) {
    const day = new Date().toISOString().slice(0, 10)
    const note = { emoji: '💌', text: 'notif.compliment', params: { name: readers.name }, link: `/pet/${id}` }
    await Promise.all([readers.ownerId, ...readers.artistIds].filter(r => r !== user.id)
      .map(r => notify(r, `complimenti:${id}:${day}`, note)))
  }
  return { ok: true }
})
