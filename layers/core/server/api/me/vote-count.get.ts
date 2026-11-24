import { sql } from 'drizzle-orm'

// Quante volte hai votato in tutto (duelli e sfide), anche senza account (stesso votante dei voti):
// è il numero accanto al cuore nella testata, che così non riparte da zero cambiando pagina.
// Legge la sessione senza scriverla: parte insieme al primo duello, e se creasse anche lei un votante
// anonimo i due cookie si sovrascriverebbero e il primo voto non varrebbe più
export default defineEventHandler(async (event): Promise<{ count: number }> => {
  const session = await getUserSession(event)
  const user = session.user ? await loadSessionUser(session.user) : null
  const voterId = user ? `u:${user.id}` : session.voterId
  if (!voterId) return { count: 0 }
  const db = await useDb()
  const { rows } = await db.execute<{ n: number | string }>(sql`
    select (select count(*) from votes where voter_id = ${voterId})
         + (select count(*) from challenge_votes where voter_id = ${voterId}) as n`)
  return { count: Number(rows[0]?.n ?? 0) }
})
