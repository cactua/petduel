import { sql } from 'drizzle-orm'

// Numeri sui pulsanti del menu admin: quante cose aspettano qualcuno
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await useDb()
  const { rows: [r] } = await db.execute<{ photos: number, shelters: number }>(sql`
    select (select count(*)::int from photos where status = 'pending') as photos,
      (select count(*)::int from shelters where status = 'pending') as shelters
  `)
  return r!
})
