import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { NEW_TALENT_DAYS, PERIODS, TOP_RANK, speciesFilterSchema, type Leaderboard, type Period, type RankedPet, type Species } from '#shared/models'
import { splitBoard } from '../utils/leaderboard'

const TZ = 'Europe/Rome'
const UNIT: Partial<Record<Period, string>> = { settimana: 'week', mese: 'month' }

const querySchema = z.object({
  species: speciesFilterSchema,
  period: z.enum(PERIODS).default('settimana'),
  // Classifica di una città: più pet possono essere primi da qualche parte
  city: z.string().trim().min(1).max(40).optional(),
})

type Row = {
  id: number
  name: string
  species: Species
  breed: string
  city: string
  owner_id: number
  owner: string
  image: string
  rank: number
  species_rank: number
  score: number
}

/**
 * Righe della classifica: senza ownerId quelle in vetrina (top generale e top di ogni specie),
 * con ownerId i pet di quell'utente, ovunque siano. La posizione si calcola sempre su tutti i pet in gara.
 */
async function loadRows(species: Species | undefined, period: Period, city: string | undefined, ownerId: number | null) {
  const db = await useDb()
  const visible = sql`${species ? sql`p.species = ${species}` : sql`true`}
    and ${city ? sql`lower(trim(p.city)) = lower(${city})` : sql`true`}
    and not p.hide_from_rankings
    and ${period === 'nuovi' ? sql`p.created_at >= now() - make_interval(days => ${NEW_TALENT_DAYS})` : sql`true`}
    and exists (select 1 from photos ph where ph.pet_id = p.id and ph.status = 'approved')`

  // Si conta in cuori: ogni voto contato vale uno e non se ne perdono mai. "sempre": tutti i cuori;
  // settimana e mese: quelli ricevuti nel periodo (ora italiana). L'Elo, nascosto, decide solo i pari merito.
  // Chi ha zero cuori resta fuori da ogni classifica.
  const unit = UNIT[period] ? sql.raw(`'${UNIT[period]}'`) : null
  const since = unit && sql`date_trunc(${unit}, now() at time zone ${TZ}) at time zone ${TZ}`
  const ranked = since
    ? sql`select p.id, p.elo, count(v.id)::int as score
        from pets p left join votes v on v.winner_id = p.id and v.delta > 0 and v.created_at >= ${since}
        where ${visible}
        group by p.id`
    : sql`select p.id, p.elo, p.wins as score from pets p where ${visible}`

  const { rows } = await db.execute<Row>(sql`
    with stats as (${ranked}),
    ranked as (
      select stats.*,
        row_number() over (order by score desc, stats.elo desc, stats.id)::int as rank,
        row_number() over (partition by p.species order by score desc, stats.elo desc, stats.id)::int as species_rank
      from stats join pets p on p.id = stats.id
    )
    select r.rank, r.species_rank, r.score,
      p.id, p.name, p.species, p.breed, p.city, p.owner_id,
      u.username as owner,
      (select ph.image from photos ph where ph.pet_id = p.id and ph.status = 'approved' order by ph.created_at desc limit 1) as image
    from ranked r
    join pets p on p.id = r.id
    join users u on u.id = p.owner_id
    where ${ownerId !== null ? sql`p.owner_id = ${ownerId}` : sql`r.rank <= ${TOP_RANK} ${species ? sql`` : sql`or r.species_rank <= ${TOP_RANK}`}`}
    order by r.rank`)
  return rows
}

// La parte pubblica è uguale per tutti: si ricalcola al massimo una volta al minuto per specie, periodo e città
const publicRows = defineCachedFunction(
  (species: Species | undefined, period: Period, city: string | undefined) => loadRows(species, period, city, null),
  { name: 'leaderboard', maxAge: 60, getKey: (species, period, city) => `${species ?? 'tutte'}:${period}:${city?.toLowerCase() ?? ''}` },
)

export default defineEventHandler(async (event): Promise<Leaderboard> => {
  const { species, period, city } = await getValidatedQuery(event, querySchema.parse)
  const { user } = await getUserSession(event)
  const db = await useDb()

  const unit = UNIT[period] ? sql.raw(`'${UNIT[period]}'`) : null
  const [top, mine] = await Promise.all([
    publicRows(species, period, city),
    user ? loadRows(species, period, city, user.id) : [],
  ])
  // Conta la vetrina in cache: un proprio pet che c'è arriva da entrambe e si tiene quella riga;
  // uno appena salito ma non ancora in cache resta tra "i tuoi pet" finché la cache si aggiorna
  const outside = (n: number) => Math.max(n, TOP_RANK + 1)
  const rows = [...top, ...mine.filter(m => !top.some(r => r.id === m.id))
    .map(m => ({ ...m, rank: outside(m.rank), species_rank: outside(m.species_rank) }))]

  let resetsAt: string | null = null
  if (unit) {
    const { rows: [next] } = await db.execute<{ at: Date }>(
      sql`select (date_trunc(${unit}, now() at time zone ${TZ}) + ('1 ' || ${unit})::interval) at time zone ${TZ} as at`,
    )
    resetsAt = next ? new Date(next.at).toISOString() : null
  }

  const toRanked = (r: Row): RankedPet => ({
    id: r.id,
    name: r.name,
    species: r.species,
    breed: r.breed,
    city: r.city,
    image: imageUrl(r.image),
    owner: r.owner,
    rank: r.rank,
    speciesRank: r.species_rank,
    score: r.score,
  })

  return {
    period,
    species: species ?? null,
    city: city ?? null,
    resetsAt,
    ...splitBoard(rows, { species: species ?? null, userId: user?.id ?? null }, toRanked),
  }
})
