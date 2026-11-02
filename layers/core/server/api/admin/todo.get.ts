import { sql } from 'drizzle-orm'

// Numeri sui pulsanti del menu admin: quante cose aspettano qualcuno
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await useDb()
  const { rows: [r] } = await db.execute<{ photos: number, shelters: number, reports: number }>(sql`
    select (select count(*)::int from photos where status = 'pending') as photos,
      (select count(*)::int from shelters where status = 'pending') as shelters,
      (select count(distinct coalesce('p' || r.photo_id, 'u' || r.user_id))::int from reports r
        left join photos p on p.id = r.photo_id
        where r.status = 'open' and (r.user_id is not null or p.status = 'approved')) as reports
  `)
  return r!
})
