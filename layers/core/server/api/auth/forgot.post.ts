import { eq } from 'drizzle-orm'
import { z } from 'zod'
import site from '#site'
import { users } from '../../db/schema'
import { emailSchema } from '#shared/models'

const bodySchema = z.object({ email: emailSchema, locale: z.string().max(5).optional() })

// Link per scegliere una password nuova, mandato all'email dell'account. La risposta è sempre la stessa,
// che l'email sia registrata o no: da qui non si scopre chi ha un account
const MAX_PER_ACCOUNT = 3
const MAX_PER_NETWORK = 10
const WINDOW_MS = 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'validation.email' })
  const { email } = parsed.data
  const locale = mailLocale(parsed.data.locale)

  if (await hitLimit(`forgot:network:${networkOf(event)}`, WINDOW_MS) > MAX_PER_NETWORK) {
    throw createError({ statusCode: 429, statusMessage: 'errors.tooManyRequests' })
  }
  // Oltre il limite per account non si manda più niente, ma la risposta non cambia
  if (await hitLimit(`forgot:account:${email}`, WINDOW_MS) > MAX_PER_ACCOUNT) return { ok: true }

  const db = await useDb()
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || user.bannedAt) return { ok: true }

  const origin = siteOrigin(event)
  if (!origin) {
    console.error('[email] NUXT_SITE_URL non configurato: link per la nuova password non inviato')
    return { ok: true }
  }
  const token = await createEmailToken(user.id, 'reset')
  const params = { site: site.name, username: user.username, link: `${origin}/reset-password?token=${token}` }
  await sendMail({
    to: user.email,
    subject: serverT(locale, 'mail.resetSubject', params),
    text: serverT(locale, 'mail.resetText', params),
  })
  return { ok: true }
})
