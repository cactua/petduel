import { z } from 'zod'

const querySchema = z.object({ token: z.string().max(200) })

// La pagina della nuova password chiede prima se il link vale ancora, così non si scrive una password per niente
export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event))
  return { valid: query.success && !!await peekEmailToken(query.data.token, 'reset') }
})
