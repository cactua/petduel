import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { challengeEntries, challenges } from '../../../db/schema'
import { TRANSLATED_LOCALES, type AdminChallengeDetail } from '#shared/models'
import { challengeTheme } from '#shared/themes'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

/**
 * Una sfida per il modulo di modifica: i campi, lo stato e quanti partecipano (per sapere cosa si può ancora cambiare).
 * Le sfide automatiche non hanno traduzioni salvate: si parte dai testi del tema nelle varie lingue
 */
export default defineEventHandler(async (event): Promise<AdminChallengeDetail> => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [c] = await db.select().from(challenges).where(eq(challenges.id, id))
  if (!c) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })
  const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(challengeEntries).where(eq(challengeEntries.challengeId, id))

  const theme = challengeTheme(c)
  const translations = Object.fromEntries(TRANSLATED_LOCALES.map((code) => {
    const saved = c.translations[code]
    if (saved) return [code, saved]
    if (theme) return [code, { title: serverT(code, `themes.${theme.slug}.title`), description: serverT(code, `themes.${theme.slug}.description`) }]
    return [code, { title: '', description: '' }]
  }))
  return {
    id: c.id,
    slug: c.slug,
    status: challengeStatus(c),
    entries: count?.n ?? 0,
    automatic: c.createdBy === null,
    fields: {
      title: c.title,
      description: c.description,
      translations,
      emoji: c.emoji,
      species: c.species,
      adoptionOnly: c.adoptionOnly,
      startDate: romeDate(c.startsAt),
    },
  }
})
