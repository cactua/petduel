import { eq } from 'drizzle-orm'
import { shelters } from '@core/server/db/schema'
import { shelterProfileSchema } from '#shared/models'

// Un rifugio verificato cura da solo la sua pagina; nome, città e codice fiscale
// restano quelli controllati dai moderatori. Link per le donazioni e IBAN nuovi aspettano un moderatore:
// chi ruba l'account di un rifugio non può dirottare le donazioni. Toglierli invece vale subito
export default defineEventHandler(async (event) => {
  const { shelter } = await requireShelter(event)
  const parsed = shelterProfileSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const { socials, donateUrl, iban, ...rest } = parsed.data
  const payment = (value: string, live: string) => value === '' || value === live
    ? { live: value, pending: null }
    : { live, pending: value }
  const donate = payment(donateUrl, shelter.donateUrl)
  const account = payment(iban, shelter.iban)
  const db = await useDb()
  // Dei social si tengono solo quelli compilati
  await db.update(shelters).set({
    ...rest,
    socials: Object.fromEntries(Object.entries(socials).filter(([, v]) => v)),
    donateUrl: donate.live,
    pendingDonateUrl: donate.pending,
    iban: account.live,
    pendingIban: account.pending,
  }).where(eq(shelters.id, shelter.id))
  return { ok: true, paymentPending: !!(donate.pending ?? account.pending) }
})

