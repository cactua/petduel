import { describe, expect, it } from 'vitest'
import type { Species } from '#shared/models'
import { splitBoard, type BoardRow } from '../layers/core/server/utils/leaderboard'

// Righe come le restituisce il database: già ordinate, con le posizioni calcolate
function board(list: { id: number, species: Species, score: number, owner?: number }[]) {
  const sorted = [...list].sort((a, b) => b.score - a.score || a.id - b.id)
  const perSpecies = new Map<Species, number>()
  return sorted.map((p, i) => {
    const sr = (perSpecies.get(p.species) ?? 0) + 1
    perSpecies.set(p.species, sr)
    return { id: p.id, species: p.species, owner_id: p.owner ?? 99, rank: i + 1, species_rank: sr, score: p.score } satisfies BoardRow & { id: number }
  })
}
const ids = (list: { id: number }[]) => list.map(p => p.id)
const split = (rows: ReturnType<typeof board>, species: Species | null = null, userId: number | null = null) =>
  splitBoard(rows, { species, userId }, r => ({ id: r.id }))

describe('classifica: solo la top 3, mai chi ha zero cuori', () => {
  const rows = board([
    { id: 1, species: 'dog', score: 20 },
    { id: 2, species: 'dog', score: 15 },
    { id: 3, species: 'cat', score: 14 },
    { id: 4, species: 'dog', score: 12 },
    { id: 5, species: 'dog', score: 10 },
    { id: 6, species: 'dog', score: 9 },
    { id: 7, species: 'dog', score: 3, owner: 1 },
    { id: 8, species: 'cat', score: 0, owner: 1 },
    { id: 9, species: 'cat', score: 1 },
  ])

  it('mostra al massimo 3 pet nella top generale', () => {
    expect(ids(split(rows).top)).toEqual([1, 2, 3])
  })

  it('mostra la top 3 di ogni specie, senza i pet a zero cuori', () => {
    const { bySpecies } = split(rows)
    expect(bySpecies.find(g => g.species === 'dog')!.top.map(p => p.id)).toEqual([1, 2, 4])
    expect(bySpecies.find(g => g.species === 'cat')!.top.map(p => p.id)).toEqual([3, 9])
  })

  it('non mostra le specie raggruppate quando se ne guarda una', () => {
    expect(split(rows, 'dog').bySpecies).toEqual([])
  })

  it('i pet fuori dalla top li riceve solo il proprietario', () => {
    expect(ids(split(rows).mine)).toEqual([])
    expect(ids(split(rows, null, 1).mine)).toEqual([7, 8])
  })

  it('dice quanti cuori mancano per superare il terzo della specie', () => {
    const mine = split(rows, null, 1).mine
    // Terzo tra i cani: 12 cuori, il pet ne ha 3 → ne servono 10 per passarlo
    expect(mine.find(p => p.id === 7)!.toTop).toBe(10)
    // Tra i gatti la top non è piena: basta un cuore
    expect(mine.find(p => p.id === 8)!.toTop).toBe(1)
  })

  it('un proprio pet nella top non compare anche tra "i tuoi pet"', () => {
    expect(ids(split(board([{ id: 1, species: 'dog', score: 5, owner: 1 }]), null, 1).mine)).toEqual([])
  })
})
