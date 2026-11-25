import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { challengeEntries, challenges } from '../../../db/schema'
import { challengeFieldsSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

/**
 * Modifica una sfida già creata. Testi, traduzioni ed emoji si cambiano sempre; la data solo finché non è iniziata;
 * specie e "solo rifugi" solo finché nessuno partecipa, per non lasciare in gara pet che non ci potrebbero stare.
 * L'indirizzo (slug) resta lo stesso, così i link già condivisi continuano a funzionare.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = challengeFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const { title, description, translations, emoji, species, adoptionOnly, startDate } = parsed.data

  const db = await useDb()
  const [c] = await db.select().from(challenges).where(eq(challenges.id, id))
  if (!c) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })

  let { startsAt, endsAt } = c
  if (startDate !== romeDate(c.startsAt)) {
    if (c.startsAt <= new Date()) throw createError({ statusCode: 409, statusMessage: 'errors.challengeStarted' })
    try {
      startsAt = await romeMidnightAfter(startDate, 0)
      endsAt = await romeMidnightAfter(startDate, 7)
    }
    catch {
      throw createError({ statusCode: 400, statusMessage: 'errors.invalidDate' })
    }
    if (endsAt <= new Date()) throw createError({ statusCode: 400, statusMessage: 'errors.challengeInPast' })
  }

  if (species !== c.species || adoptionOnly !== c.adoptionOnly) {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(challengeEntries).where(eq(challengeEntries.challengeId, id))
    if (row?.n) throw createError({ statusCode: 409, statusMessage: 'errors.challengeEntriesLock' })
  }

  // Una sfida automatica modificata diventa di chi l'ha modificata: non la sostituisce più una programmata a mano
  await db.update(challenges)
    .set({ title, description, translations, emoji, species, adoptionOnly, startsAt, endsAt, createdBy: c.createdBy ?? admin.id })
    .where(eq(challenges.id, id))
  return { slug: c.slug }
})
