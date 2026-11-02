import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { compliments, photos } from '../../../db/schema'
import type { ComplimentKind, PetCompliments } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// I complimenti di un partecipante: i propri a chi li ha fatti, i totali solo a proprietario e artista
export default defineEventHandler(async (event): Promise<PetCompliments> => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const readers = await complimentReaders(id)
  if (!readers) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  const { user } = await getUserSession(event)
  if (!user) return { mine: [], counts: null, canGive: false }

  const db = await useDb()
  const canRead = user.id === readers.ownerId || readers.artistIds.includes(user.id)
  const [mine, totals, [approved], blocked] = await Promise.all([
    db.select({ kind: compliments.kind }).from(compliments).where(and(eq(compliments.petId, id), eq(compliments.userId, user.id))),
    canRead
      ? db.select({ kind: compliments.kind, n: count() }).from(compliments).where(eq(compliments.petId, id)).groupBy(compliments.kind)
      : [],
    db.select({ n: count() }).from(photos).where(and(eq(photos.petId, id), eq(photos.status, 'approved'))),
    isBlockedBetween(user.id, readers.ownerId),
  ])
  return {
    mine: mine.map(m => m.kind),
    counts: canRead ? Object.fromEntries(totals.map(t => [t.kind, t.n])) as Partial<Record<ComplimentKind, number>> : null,
    canGive: user.id !== readers.ownerId && !!approved?.n && !blocked,
  }
})
