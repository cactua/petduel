import { z } from 'zod'
import type { GeocodeResult } from '#shared/models'

const querySchema = z.object({ q: z.string().trim().min(3).max(140) })

// Ricerca indirizzi su Nominatim (OpenStreetMap). Regole d'uso: un User-Agent riconoscibile, poche
// richieste (solo su "Cerca", mai mentre si scrive) e risultati in cache.
const search = defineCachedFunction(async (q: string, lang: string): Promise<GeocodeResult[]> => {
  const { legal } = useRuntimeConfig().public
  const rows = await $fetch<{ display_name: string, lat: string, lon: string }[]>('https://nominatim.openstreetmap.org/search', {
    query: { q, format: 'jsonv2', limit: 5 },
    headers: { 'user-agent': `PetDuel/1.0 (${legal.email || 'petduel'})`, 'accept-language': lang },
    timeout: 8000,
  })
  return rows.map(r => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}, { name: 'geocode', maxAge: 60 * 60 * 24 * 7, getKey: (q: string, lang: string) => `${lang}:${q.toLowerCase()}` })

export default defineEventHandler(async (event) => {
  await requireShelter(event)
  const { q } = await getValidatedQuery(event, querySchema.parse)
  const lang = getCookie(event, 'lingua') || 'it'
  try {
    return await search(q, lang)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'errors.geocode' })
  }
})
