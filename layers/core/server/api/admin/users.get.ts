import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AdminUserList } from '#shared/models'

const querySchema = z.object({
  q: z.string().trim().toLowerCase().max(60).default(''),
  filter: z.enum(['all', 'admin', 'banned', 'shelter']).default('all'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
})
const PAGE = 30

// Ricerca per username o email, con i numeri che servono per capire chi è
export default defineEventHandler(async (event): Promise<AdminUserList> => {
  await requireAdmin(event)
  const { q, filter, page } = await getValidatedQuery(event, querySchema.parse)
  const db = await useDb()
  const like = `%${q.replace(/[\\%_]/g, m => `\\${m}`)}%`
  const where = sql`(${q} = '' or u.username like ${like} or u.email like ${like})
    and (${filter} <> 'admin' or u.role = 'admin')
    and (${filter} <> 'banned' or u.banned_at is not null)
    and (${filter} <> 'shelter' or s.id is not null)`

  const { rows } = await db.execute<{
    id: number, username: string, email: string, role: 'user' | 'admin', banned_at: Date | null, created_at: Date
    pets: number, votes: number, pending: number, shelter: string | null, total: number
  }>(sql`
    select u.id, u.username, u.email, u.role, u.banned_at, u.created_at, s.name as shelter,
      (select count(*)::int from pets p where p.owner_id = u.id) as pets,
      (select count(*)::int from votes v where v.voter_id = 'u:' || u.id)
        + (select count(*)::int from challenge_votes v where v.voter_id = 'u:' || u.id) as votes,
      (select count(*)::int from photos ph join pets p on p.id = ph.pet_id where p.owner_id = u.id and ph.status = 'pending') as pending,
      count(*) over ()::int as total
    from users u left join shelters s on s.user_id = u.id
    where ${where}
    order by u.created_at desc
    limit ${PAGE} offset ${(page - 1) * PAGE}
  `)
  return {
    total: rows[0]?.total ?? 0,
    users: rows.map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role,
      banned: !!r.banned_at,
      createdAt: new Date(r.created_at).toISOString(),
      pets: r.pets,
      votes: r.votes,
      pendingPhotos: r.pending,
      shelter: r.shelter,
    })),
  }
})
