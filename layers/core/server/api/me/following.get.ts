import { sql } from 'drizzle-orm'
import type { FollowedWork } from '#shared/models'

const LIMIT = 60

// Lavori approvati di chi segui, i più recenti: caricati da lui o che lo indicano come artista
export default defineEventHandler(async (event): Promise<{ users: string[], works: FollowedWork[] }> => {
  const user = await requireUser(event)
  const db = await useDb()
  const [{ rows: followed }, { rows }] = await Promise.all([
    db.execute<{ username: string }>(sql`
      select u.username from follows f join users u on u.id = f.followed_id
      where f.follower_id = ${user.id} order by f.created_at desc`),
    db.execute<{ photo_id: number, pet_id: number, name: string, image: string, owner: string, credit: string | null, credit_url: string | null, via: string, created_at: Date }>(sql`
      select ph.id as photo_id, p.id as pet_id, p.name, ph.image, o.username as owner, ph.credit, ph.credit_url,
        case when f_owner.followed_id is not null then o.username else a.username end as via, ph.created_at
      from photos ph
      join pets p on p.id = ph.pet_id
      join users o on o.id = p.owner_id
      left join users a on a.id = ph.artist_id
      left join follows f_owner on f_owner.follower_id = ${user.id} and f_owner.followed_id = p.owner_id
      left join follows f_artist on f_artist.follower_id = ${user.id} and f_artist.followed_id = ph.artist_id
      where ph.status = 'approved' and (f_owner.followed_id is not null or f_artist.followed_id is not null)
      order by ph.created_at desc limit ${LIMIT}`),
  ])
  return {
    users: followed.map(f => f.username),
    works: rows.map(r => ({
      photoId: r.photo_id,
      petId: r.pet_id,
      name: r.name,
      image: imageUrl(r.image),
      owner: r.owner,
      credit: photoCredit(r.credit, r.credit_url),
      via: r.via,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  }
})
