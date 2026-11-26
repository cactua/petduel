import { z } from 'zod'
import { entrySlug } from '#shared/models'

const paramsSchema = z.object({ username: z.string().min(1).max(40), slug: z.string().min(1).max(200) })

// Pagina /u/<utente>/<nome>: quale partecipante è. `slug` è il nome attuale nell'indirizzo:
// se è diverso da quello chiesto (vecchio nome, maiuscole) la pagina passa all'indirizzo giusto
export default defineEventHandler(async (event) => {
  const { username, slug } = await getValidatedRouterParams(event, paramsSchema.parse)
  const pet = await findPetBySlug(username, slug.toLowerCase())
  if (!pet) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  return { id: pet.id, slug: entrySlug(pet.name) }
})
