import { eq } from 'drizzle-orm'
import { renderSVG } from 'uqr'
import { z } from 'zod'
import { users } from '../../../db/schema'
import site from '#site'

const bodySchema = z.object({ password: z.string().min(1).max(200) })

// Primo passo dell'attivazione: dopo la password, un segreto nuovo da inquadrare con l'app.
// Resta in attesa finché non arriva un codice giusto (enable); quello attivo, se c'è, non cambia
export default defineEventHandler(async (event) => {
  const user = await loadFullUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  await confirmPassword(user, parsed.data.password)
  if (user.totpEnabledAt) throw createError({ statusCode: 409, statusMessage: 'errors.totpAlreadyOn' })

  const secret = generateTotpSecret()
  const db = await useDb()
  await db.update(users).set({ totpPendingSecret: sealTotpSecret(secret, totpKey()) }).where(eq(users.id, user.id))
  const uri = totpUri(site.name, user.username, secret)
  return { secret, uri, qr: renderSVG(uri, { border: 2 }) }
})
