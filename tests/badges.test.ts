import { describe, expect, it } from 'vitest'
import { petBadges, type BadgeStats } from '#shared/badges'

const stats = (s: Partial<BadgeStats>): BadgeStats => ({ hearts: 0, approvedPhotos: 1, challenges: 0, weeksFirst: 0, adopted: false, ...s })
const keys = (s: Partial<BadgeStats>) => petBadges(stats(s)).map(b => b.key)

describe('traguardi: solo cose belle', () => {
  it('un pet senza cuori non ha traguardi (e quindi niente di brutto da mostrare)', () => {
    expect(keys({})).toEqual([])
  })
  it('il primo cuore vale "Prima vittoria"', () => {
    expect(keys({ hearts: 1 })).toEqual(['firstWin'])
  })
  it('delle fasce di cuori si mostra solo la più alta, al posto della prima vittoria', () => {
    expect(keys({ hearts: 120 })).toEqual(['adored'])
    expect(keys({ hearts: 1000 })).toEqual(['legend'])
  })
  it('"Pet della settimana" viene prima di tutto e conta le volte', () => {
    const [first] = petBadges(stats({ hearts: 30, weeksFirst: 2 }))
    expect(first).toMatchObject({ key: 'petOfWeek', times: 2 })
  })
  it('foto, sfide e adozione danno i loro traguardi', () => {
    expect(keys({ approvedPhotos: 5, challenges: 3, adopted: true })).toEqual(['adopted', 'challenger', 'photogenic'])
  })
})
