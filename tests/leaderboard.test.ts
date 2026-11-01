import { describe, expect, it } from 'vitest'
import type { Species } from '#shared/models'
import { splitBoard, type BoardRow } from '../server/utils/leaderboard'

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

describe('classifica: solo la top 5, mai chi ha zero cuori', () => {
  const rows = board([
    { id: 1, species: 'cane', score: 20 },
    { id: 2, species: 'cane', score: 15 },
    { id: 3, species: 'gatto', score: 14 },
    { id: 4, species: 'cane', score: 12 },
    { id: 5, species: 'cane', score: 10 },
    { id: 6, species: 'cane', score: 9 },
    { id: 7, species: 'cane', score: 3, owner: 1 },
    { id: 8, species: 'gatto', score: 0, owner: 1 },
    { id: 9, species: 'gatto', score: 1 },
  ])

  it('mostra al massimo 5 pet nella top generale', () => {
    expect(ids(split(rows).top)).toEqual([1, 2, 3, 4, 5])
  })

  it('mostra la top 5 di ogni specie, senza i pet a zero cuori', () => {
    const { bySpecies } = split(rows)
    expect(bySpecies.find(g => g.species === 'cane')!.top.map(p => p.id)).toEqual([1, 2, 4, 5, 6])
    expect(bySpecies.find(g => g.species === 'gatto')!.top.map(p => p.id)).toEqual([3, 9])
  })

  it('non mostra le specie raggruppate quando se ne guarda una', () => {
    expect(split(rows, 'cane').bySpecies).toEqual([])
  })

  it('i pet fuori dalla top li riceve solo il proprietario', () => {
    expect(ids(split(rows).mine)).toEqual([])
    expect(ids(split(rows, null, 1).mine)).toEqual([7, 8])
  })

  it('dice quanti cuori mancano per superare il quinto della specie', () => {
    const mine = split(rows, null, 1).mine
    // Quinto tra i cani: 9 cuori, il pet ne ha 3 → ne servono 7 per passarlo
    expect(mine.find(p => p.id === 7)!.toTop).toBe(7)
    // Tra i gatti la top non è piena: basta un cuore
    expect(mine.find(p => p.id === 8)!.toTop).toBe(1)
  })

  it('un proprio pet nella top non compare anche tra "i tuoi pet"', () => {
    expect(ids(split(board([{ id: 1, species: 'cane', score: 5, owner: 1 }]), null, 1).mine)).toEqual([])
  })
})
