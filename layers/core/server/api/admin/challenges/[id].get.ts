import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { challenges } from '../../../db/schema'
import { TRANSLATED_LOCALES, type ChallengeFields } from '#shared/models'
import { challengeTheme } from '#shared/themes'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

/**
 * I campi di una sfida per il modulo di modifica. Le sfide automatiche non hanno traduzioni salvate:
 * si parte dai testi del tema nelle varie lingue, così l'admin ritrova quello che vede chi gioca
 */
export default defineEventHandler(async (event): Promise<ChallengeFields & { started: boolean }> => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const db = await useDb()
  const [c] = await db.select().from(challenges).where(eq(challenges.id, id))
  if (!c) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })

  const theme = challengeTheme(c)
  const translations = Object.fromEntries(TRANSLATED_LOCALES.map((code) => {
    const saved = c.translations[code]
    if (saved) return [code, saved]
    if (theme) return [code, { title: serverT(code, `themes.${theme.slug}.title`), description: serverT(code, `themes.${theme.slug}.description`) }]
    return [code, { title: '', description: '' }]
  }))
  return {
    title: c.title,
    description: c.description,
    translations,
    emoji: c.emoji,
    species: c.species,
    adoptionOnly: c.adoptionOnly,
    startDate: romeDate(c.startsAt),
    started: c.startsAt <= new Date(),
  }
})
