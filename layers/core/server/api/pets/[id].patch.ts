import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets } from '../../db/schema'
import { entryUrl, petFieldsSchema } from '#shared/models'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

// Il proprietario corregge nome, specie, razza e città. Elo e vittorie restano quelli guadagnati.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const parsed = petFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'validation.check' })

  const db = await useDb()
  const [before] = await db.select({ name: pets.name }).from(pets).where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
  if (!before) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  // Il nome fa parte dell'indirizzo: unico tra i partecipanti dell'utente, e il vecchio indirizzo resta valido
  await assertPetNameFree(user.id, parsed.data.name, id)
  await db.update(pets).set(parsed.data).where(and(eq(pets.id, id), eq(pets.ownerId, user.id)))
  await rememberOldSlug(user.id, id, before.name, parsed.data.name)
  // Indirizzo nuovo della pagina, per chi la sta guardando
  return { ok: true, url: entryUrl({ owner: user.username, name: parsed.data.name }) }
})
