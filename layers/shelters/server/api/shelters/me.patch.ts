import { eq } from 'drizzle-orm'
import { shelters } from '@core/server/db/schema'
import { shelterProfileSchema } from '#shared/models'

// Un rifugio verificato cura da solo la sua pagina; nome, città e codice fiscale
// restano quelli controllati dai moderatori
export default defineEventHandler(async (event) => {
  const { shelter } = await requireShelter(event)
  const parsed = shelterProfileSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })
  const { socials, ...rest } = parsed.data
  const db = await useDb()
  // Dei social si tengono solo quelli compilati
  await db.update(shelters).set({ ...rest, socials: Object.fromEntries(Object.entries(socials).filter(([, v]) => v)) })
    .where(eq(shelters.id, shelter.id))
  return { ok: true }
})
