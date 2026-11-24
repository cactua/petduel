import { z } from 'zod'
import { LANGUAGES } from '../../../i18n/languages'
import { pushSubscriptions } from '../../db/schema'

const bodySchema = z.object({
  // Indirizzo del servizio push del browser (Google, Mozilla, Apple, Microsoft): sempre https
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
  locale: z.enum(LANGUAGES.map(l => l.code) as [string, ...string[]]).catch('it'),
})

// Attiva le notifiche push su questo dispositivo (o aggiorna lingua e utente se c'era già)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!pushConfigured()) throw createError({ statusCode: 503, statusMessage: 'push.unavailable' })
  const body = await readValidatedBody(event, b => bodySchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  const { endpoint, keys, locale } = body.data
  const db = await useDb()
  await db.insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, locale })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, locale } })
  return { ok: true }
})
