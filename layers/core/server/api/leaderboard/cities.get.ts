import { sql } from 'drizzle-orm'

// Sotto questa soglia una città non ha abbastanza pet per una classifica sua
const MIN_PETS = 3

/** Città con abbastanza pet in gara, dalla più popolosa; "here" è quella di chi guarda, se c'è in elenco */
const loadCities = defineCachedFunction(async () => {
  const db = await useDb()
  const { rows } = await db.execute<{ name: string, pets: number }>(sql`
    select min(trim(p.city)) as name, count(*)::int as pets
    from pets p
    where trim(p.city) <> '' and not p.hide_from_rankings
      and exists (select 1 from photos ph where ph.pet_id = p.id and ph.status = 'approved')
    group by lower(trim(p.city))
    having count(*) >= ${MIN_PETS}
    order by pets desc, name
    limit 40`)
  return rows
}, { name: 'leaderboard-cities', maxAge: 600 })

export default defineEventHandler(async (event) => {
  const cities = await loadCities()
  const { city } = visitorGeo(event)
  const here = city ? cities.find(c => c.name.toLowerCase() === city.toLowerCase())?.name ?? null : null
  return { cities, here }
})
