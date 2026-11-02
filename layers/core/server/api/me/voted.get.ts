import { sql } from 'drizzle-orm'
import type { VotedPet } from '#shared/models'

const LIMIT = 60

// I partecipanti scelti negli ultimi duelli, anche senza account (stesso votante dei voti).
// Si vedono solo quelli ancora pubblici, con l'ultima immagine approvata e il suo artista
export default defineEventHandler(async (event): Promise<VotedPet[]> => {
  const { voterId, userId } = await getVoter(event)
  const db = await useDb()
  const { rows } = await db.execute<{ id: number, name: string, owner: string, voted_at: Date, image: string, credit: string | null, credit_url: string | null }>(sql`
    with v as (
      select winner_id, max(created_at) as voted_at from votes where voter_id = ${voterId}
      group by winner_id order by voted_at desc limit ${LIMIT}
    )
    select p.id, p.name, u.username as owner, v.voted_at, ph.image, ph.credit, ph.credit_url
    from v
    join pets p on p.id = v.winner_id
    join users u on u.id = p.owner_id
    join lateral (
      select image, credit, credit_url from photos where pet_id = p.id and status = 'approved' order by created_at desc limit 1
    ) ph on true
    where ${userId ? sql`not exists (select 1 from blocks b where b.blocker_id = ${userId} and b.blocked_id = p.owner_id)` : sql`true`}
    order by v.voted_at desc`)
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    image: imageUrl(r.image),
    owner: r.owner,
    credit: photoCredit(r.credit, r.credit_url),
    votedAt: new Date(r.voted_at).toISOString(),
  }))
})
