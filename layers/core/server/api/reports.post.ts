import { and, count, eq, gte } from 'drizzle-orm'
import { pets, photos, reports, users } from '../db/schema'
import { REPORT_NOTE_MIN_ANONYMOUS, reportSchema } from '#shared/models'

// Al giorno, per persona: basta per l'uso normale, frena chi segnala tutto per dispetto
const MAX_REPORTS_PER_DAY = 20
// Senza account, per rete: chi vuole segnalare di più può farsi un account o scriverci
const MAX_ANONYMOUS_PER_DAY = 5

// Segnala un'immagine pubblicata o un profilo ai moderatori. Ripetere la stessa segnalazione non fa nulla.
// Si può segnalare anche senza account (DSA, art. 16): servono un'email per la risposta, una spiegazione
// e la dichiarazione di buona fede
export default defineEventHandler(async (event) => {
  const user = await optionalUser(event)
  const parsed = reportSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const body = parsed.data
  const db = await useDb()

  if (user) {
    const [today] = await db.select({ n: count() }).from(reports)
      .where(and(eq(reports.reporterId, user.id), gte(reports.createdAt, new Date(Date.now() - 86_400_000))))
    if ((today?.n ?? 0) >= MAX_REPORTS_PER_DAY) throw createError({ statusCode: 429, statusMessage: 'errors.tooManyReports' })
  }
  else {
    if (!body.email) throw createError({ statusCode: 400, statusMessage: 'validation.email' })
    if (body.note.length < REPORT_NOTE_MIN_ANONYMOUS) throw createError({ statusCode: 400, statusMessage: 'validation.reportNote' })
    if (!body.goodFaith) throw createError({ statusCode: 400, statusMessage: 'validation.goodFaith' })
    if (await hitLimit(`report:network:${networkOf(event)}`, 86_400_000) > MAX_ANONYMOUS_PER_DAY) {
      throw createError({ statusCode: 429, statusMessage: 'errors.tooManyReports' })
    }
  }
  const who = user
    ? { reporterId: user.id }
    : { reporterId: null, reporterEmail: body.email, reporterLocale: mailLocale(body.locale) }

  if (body.target === 'photo') {
    const [photo] = await db.select({ ownerId: pets.ownerId }).from(photos).innerJoin(pets, eq(pets.id, photos.petId))
      .where(and(eq(photos.id, body.id), eq(photos.status, 'approved')))
    if (!photo) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
    if (user && photo.ownerId === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.reportOwn' })
    await db.insert(reports).values({ ...who, photoId: body.id, reason: body.reason, note: body.note }).onConflictDoNothing()
  }
  else {
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, body.username))
    if (!target) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
    if (user && target.id === user.id) throw createError({ statusCode: 400, statusMessage: 'errors.reportOwn' })
    await db.insert(reports).values({ ...who, userId: target.id, reason: body.reason, note: body.note }).onConflictDoNothing()
  }
  return { ok: true }
})
