const ELO_K = 32

export const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// Punti che il vincitore prende al perdente
export function eloDelta(winnerElo: number, loserElo: number) {
  const expected = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400))
  return ELO_K * (1 - expected)
}

interface Candidate {
  id: number
  species: string
  elo: number
  wins: number
  losses: number
}

/**
 * Coppia "quasi casuale": stessa specie, Elo vicino, più spazio a chi ha pochi
 * duelli, mai una coppia già votata e quasi mai un pet visto da poco.
 * O(n²) sui candidati: va bene finché i pet sono qualche migliaio.
 */
export function pickPair<T extends Candidate>(pets: T[], voted: Set<string>, recent: number[]): [T, T] | null {
  const exposure = (p: T) => (recent.includes(p.id) ? 0.05 : 1) * (1 + 3 / (1 + p.wins + p.losses))
  const rivalsOf = (a: T) => pets.filter(q => q.id !== a.id && q.species === a.species && !voted.has(pairKey(a.id, q.id)))

  const a = weighted(pets.filter(p => rivalsOf(p).length > 0), exposure)
  if (!a) return null
  const b = weighted(rivalsOf(a), q => exposure(q) / (1 + Math.abs(q.elo - a.elo) / 100))!
  return Math.random() < 0.5 ? [a, b] : [b, a]
}

function weighted<T>(items: T[], weight: (item: T) => number): T | undefined {
  let r = Math.random() * items.reduce((sum, x) => sum + weight(x), 0)
  for (const item of items) {
    r -= weight(item)
    if (r <= 0) return item
  }
  return items.at(-1)
}
