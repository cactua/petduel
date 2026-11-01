import { asc, desc, gt, lte, and } from 'drizzle-orm'
import type { ChallengeList } from '#shared/models'
import { challenges } from '../../db/schema'

export default defineEventHandler(async (): Promise<ChallengeList> => {
  await ensureChallenges()
  const db = await useDb()
  const now = new Date()

  const [current, upcoming, past] = await Promise.all([
    db.select().from(challenges).where(and(lte(challenges.startsAt, now), gt(challenges.endsAt, now))).orderBy(asc(challenges.endsAt)),
    db.select().from(challenges).where(gt(challenges.startsAt, now)).orderBy(asc(challenges.startsAt)).limit(4),
    db.select().from(challenges).where(lte(challenges.endsAt, now)).orderBy(desc(challenges.endsAt)).limit(12),
  ])

  return {
    current: await toSummaries(current),
    upcoming: await toSummaries(upcoming),
    past: await toSummaries(past),
  }
})
