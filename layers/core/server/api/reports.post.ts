import { and, count, eq, gte } from 'drizzle-orm'
import { pets, photos, reports, users } from '../db/schema'
import { reportSchema } from '#shared/models'

// Al giorno, per persona: basta per l'uso normale, frena chi segnala tutto per dispetto
const MAX_REPORTS_PER_DAY = 20

// Segnala un'immagine pubblicata o un profilo ai moderatori. Ripetere la stessa segnalazione non fa nulla
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const parsed = reportSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const body = parsed.data

  const db = await useDb()
  const [today] = await db.select({ n: count() }).from(reports)
    .where(and(eq(reports.reporterId, user.id), gte(reports.createdAt, new Date(Date.now() - 86_400_000))))
  if ((today?.n ?? 0) >= MAX_REPORTS_PER_DAY) throw createError({ statusCode: 429, statusMessage: 'errors.tooManyReports' })

  if (body.target === 'photo') {
    const [photo] = await db.select({ ownerId: pets.ownerId }).from(photos).innerJoin(pets, eq(pets.id, photos.petId))
      .where(and(eq(photos.id, body.id), eq(photos.status, 'approved')))
    if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
    if (photo.ownerId === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.reportOwn' })
    await db.insert(reports).values({ reporterId: user.id, photoId: body.id, reason: body.reason, note: body.note }).onConflictDoNothing()
  }
  else {
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, body.username))
    if (!target) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
    if (target.id === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.reportOwn' })
    await db.insert(reports).values({ reporterId: user.id, userId: target.id, reason: body.reason, note: body.note }).onConflictDoNothing()
  }
  return { ok: true }
})
