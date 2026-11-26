import { desc, gt, or } from 'drizzle-orm'
import { TRANSLATED_LOCALES, type AdminChallengeList } from '#shared/models'
import { challenges } from '../../../db/schema'
import { CHALLENGE_THEMES, challengeTheme } from '#shared/themes'

const DAY = 86_400_000

/**
 * Tutte le sfide per il pannello admin: in corso, programmate e quelle finite negli ultimi sei mesi.
 * Per ognuna: se è del calendario automatico e in quali lingue ha i testi (le automatiche li prendono dai file del sito)
 */
export default defineEventHandler(async (event): Promise<AdminChallengeList> => {
  await requireAdmin(event)
  await ensureChallenges()
  const db = await useDb()
  const rows = await db.select().from(challenges)
    .where(or(gt(challenges.endsAt, new Date(Date.now() - 183 * DAY)), gt(challenges.startsAt, new Date())))
    .orderBy(desc(challenges.startsAt))
    .limit(200)
  const summaries = await toSummaries(rows)
  return {
    hasThemes: CHALLENGE_THEMES.length > 0,
    items: summaries.map((s, i) => {
      const row = rows[i]!
      const themed = !!challengeTheme(row)
      return {
        ...s,
        automatic: row.createdBy === null,
        translated: themed ? [...TRANSLATED_LOCALES] : TRANSLATED_LOCALES.filter(l => row.translations[l]?.title),
      }
    }),
  }
})
