import { and, gt, lt, sql } from 'drizzle-orm'
import { challenges } from '../../db/schema'
import { challengeFieldsSchema } from '#shared/models'

// Programma una sfida di 7 giorni a partire dalla mezzanotte (ora italiana) della data scelta
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const parsed = challengeFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const { title, description, emoji, species, adoptionOnly, startDate } = parsed.data

  let startsAt: Date, endsAt: Date
  try {
    startsAt = await romeMidnightAfter(startDate, 0)
    endsAt = await romeMidnightAfter(startDate, 7)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'errors.invalidDate' })
  }
  if (endsAt <= new Date()) throw createError({ statusCode: 400, statusMessage: 'errors.challengeInPast' })

  // Una sfida generata in automatico che si sovrappone e non ha ancora partecipanti lascia il posto a questa
  const db = await useDb()
  await db.execute(sql`
    delete from challenges c
    where c.created_by is null and c.starts_at < ${endsAt} and c.ends_at > ${startsAt}
      and not exists (select 1 from challenge_entries e where e.challenge_id = c.id)`)

  const base = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'sfida'
  const [created] = await db.insert(challenges)
    .values({ slug: `${base}-${startDate}`, title, description, emoji, species, adoptionOnly, startsAt, endsAt, createdBy: admin.id })
    .onConflictDoNothing()
    .returning({ slug: challenges.slug })
  if (!created) throw createError({ statusCode: 409, statusMessage: 'errors.challengeExists' })

  const overlapping = await db.select({ id: challenges.id }).from(challenges)
    .where(and(lt(challenges.startsAt, endsAt), gt(challenges.endsAt, startsAt)))
  return { slug: created.slug, overlapping: overlapping.length - 1 }
})
