import { sql } from 'drizzle-orm'
import type { FavoritePet } from '#shared/models'

// I preferiti salvati, gli ultimi in cima; solo quelli ancora pubblici e non di chi hai bloccato
export default defineEventHandler(async (event): Promise<FavoritePet[]> => {
  const user = await requireUser(event)
  const db = await useDb()
  const { rows } = await db.execute<{ id: number, name: string, owner: string, image: string, credit: string | null, credit_url: string | null }>(sql`
    select p.id, p.name, u.username as owner, ph.image, ph.credit, ph.credit_url
    from favorites f
    join pets p on p.id = f.pet_id
    join users u on u.id = p.owner_id
    join lateral (
      select image, credit, credit_url from photos where pet_id = p.id and status = 'approved' order by created_at desc limit 1
    ) ph on true
    where f.user_id = ${user.id}
      and not exists (select 1 from blocks b where b.blocker_id = ${user.id} and b.blocked_id = p.owner_id)
    order by f.created_at desc`)
  return rows.map(r => ({ id: r.id, name: r.name, image: imageUrl(r.image), owner: r.owner, credit: photoCredit(r.credit, r.credit_url) }))
})
