import { describe, expect, it } from 'vitest'
import { eloDelta, pairKey, pickPair } from '../layers/core/server/utils/ranking'

describe('Elo nascosto (serve solo ad abbinare i duelli)', () => {
  it('tra pari il vincitore prende metà del fattore K', () => {
    expect(eloDelta(1500, 1500)).toBeCloseTo(16)
  })
  it('battere un pet più forte vale di più', () => {
    expect(eloDelta(1400, 1600)).toBeGreaterThan(eloDelta(1600, 1400))
  })
  it('il delta è sempre positivo: i cuori non si perdono', () => {
    expect(eloDelta(2400, 800)).toBeGreaterThan(0)
  })
})

describe('abbinamento dei duelli', () => {
  const pet = (id: number, species: string, elo = 1500) => ({ id, species, elo, wins: 0, losses: 0 })

  it('la chiave della coppia non dipende dall\'ordine', () => {
    expect(pairKey(3, 7)).toBe(pairKey(7, 3))
  })

  it('abbina solo pet della stessa specie', () => {
    const pets = [pet(1, 'cane'), pet(2, 'gatto'), pet(3, 'cane')]
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickPair(pets, new Set(), [])!
      expect(a.species).toBe(b.species)
    }
  })

  it('non ripropone una coppia già votata', () => {
    const pets = [pet(1, 'cane'), pet(2, 'cane'), pet(3, 'cane')]
    const voted = new Set([pairKey(1, 2), pairKey(1, 3)])
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickPair(pets, voted, [])!
      expect(pairKey(a.id, b.id)).toBe(pairKey(2, 3))
    }
  })

  it('senza coppie possibili non propone nulla', () => {
    expect(pickPair([pet(1, 'cane'), pet(2, 'gatto')], new Set(), [])).toBeNull()
  })
})
