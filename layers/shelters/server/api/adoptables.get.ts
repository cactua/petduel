import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { speciesFilterSchema, type AdoptablePet, type AdoptionStatus, type Species } from '#shared/models'

const querySchema = z.object({
  species: speciesFilterSchema,
  city: z.string().trim().max(40).optional(),
})

type Row = {
  id: number, name: string, species: Species, breed: string, city: string, wins: number,
  adoption: AdoptionStatus, owner: string, image: string, shelter_slug: string, shelter_name: string, rank: number | null
}

/**
 * "I più amati in cerca di casa": pet dei rifugi verificati ancora da adottare, in ordine di cuori ricevuti,
 * con l'elenco delle città per il filtro "vicino a me". La città è quella del pet o, se manca, del rifugio.
 */
export default defineEventHandler(async (event): Promise<{ pets: AdoptablePet[], cities: string[] }> => {
  const { species, city } = await getValidatedQuery(event, querySchema.parse)
  const db = await useDb()
  const petCity = sql`coalesce(nullif(p.city, ''), s.city)`
  const base = sql`from pets p
    join shelters s on s.user_id = p.owner_id and s.status = 'approved'
    join users u on u.id = p.owner_id
    where p.adoption in ('available', 'fostered')
      and exists (select 1 from photos ph where ph.pet_id = p.id and ph.status = 'approved')`

  const [{ rows }, { rows: cityRows }] = await Promise.all([
    db.execute<Row>(sql`
      select * from (
        select p.id, p.name, p.species, p.breed, ${petCity} as city, p.elo, p.wins, p.adoption,
          u.username as owner, s.slug as shelter_slug, s.name as shelter_name,
          case when p.hide_from_rankings then null
            else row_number() over (partition by p.hide_from_rankings order by p.wins desc, p.elo desc, p.id)::int end as rank,
          (select ph.image from photos ph where ph.pet_id = p.id and ph.status = 'approved' order by ph.created_at desc limit 1) as image
        ${base}
      ) t
      where true
        ${species ? sql`and t.species = ${species}` : sql``}
        ${city ? sql`and lower(t.city) = lower(${city})` : sql``}
      order by t.wins desc, t.elo desc, t.id
      limit 60`),
    db.execute<{ city: string }>(sql`select distinct ${petCity} as city ${base} order by 1`),
  ])

  return {
    pets: rows.map(r => ({
      id: r.id,
      name: r.name,
      species: r.species,
      breed: r.breed,
      city: r.city,
      image: imageUrl(r.image),
      owner: r.owner,
      adoption: r.adoption,
      shelter: { slug: r.shelter_slug, name: r.shelter_name },
      rank: r.rank,
    })),
    cities: cityRows.map(c => c.city).filter(Boolean),
  }
})
