import { SPECIES, TOP_RANK, type Species } from '#shared/models'

/** Riga della classifica già ordinata dal database: posizione generale, nella specie e cuori del periodo */
export interface BoardRow {
  species: Species
  owner_id: number
  rank: number
  species_rank: number
  score: number
}

/**
 * Divide la classifica in ciò che si mostra: la top generale, la top di ogni specie (solo senza filtro)
 * e i pet dell'utente rimasti fuori, con i cuori che mancano per entrare nella top della loro specie.
 * Chi ha zero cuori non è mai in vetrina.
 */
export function splitBoard<R extends BoardRow, P>(rows: R[], opts: { species: Species | null, userId: number | null }, toPublic: (r: R) => P) {
  const counts = (r: R) => r.score > 0
  const inTop = (r: R) => r.rank <= TOP_RANK && counts(r)
  const inSpeciesTop = (r: R) => r.species_rank <= TOP_RANK && counts(r)
  const speciesTop = (s: Species) => rows.filter(r => r.species === s && inSpeciesTop(r)).sort((a, b) => a.species_rank - b.species_rank)

  // Cuori per superare il quinto della specie (se la top non è piena, ne basta uno)
  const toTop = (r: R) => {
    const top = speciesTop(r.species)
    const last = top.length >= TOP_RANK ? top[TOP_RANK - 1]!.score : 0
    return Math.max(1, last - r.score + 1)
  }

  return {
    top: rows.filter(inTop).sort((a, b) => a.rank - b.rank).map(toPublic),
    bySpecies: opts.species ? [] : SPECIES.map(s => ({ species: s, top: speciesTop(s).map(toPublic) })).filter(g => g.top.length),
    mine: rows.filter(r => opts.userId !== null && r.owner_id === opts.userId && !inTop(r) && (opts.species || !inSpeciesTop(r)))
      .map(r => ({ ...toPublic(r), toTop: toTop(r) })),
  }
}
