import { describe, expect, it } from 'vitest'
import { AD_TARGETING_DEFAULT, adTextFor, type AdTargeting } from '#shared/models'
import { adMatches, type AdVisitor } from '../layers/core/server/utils/adAudience'

const visitor = (v: Partial<AdVisitor> = {}): AdVisitor => ({
  country: 'IT', city: 'Torino', lat: 45.07, lng: 7.69, timezone: 'Europe/Rome',
  lang: 'it', species: null, loggedIn: false,
  // Mercoledì 28 ottobre 2026, 12:00 ora italiana
  now: new Date('2026-10-28T11:00:00Z'),
  ...v,
})
const targeting = (t: Partial<AdTargeting>): AdTargeting => ({ ...AD_TARGETING_DEFAULT, ...t })

describe('a chi si mostra una campagna', () => {
  it('senza filtri la vedono tutti', () => {
    expect(adMatches(AD_TARGETING_DEFAULT, visitor())).toBe(true)
  })

  it('filtra per paese', () => {
    expect(adMatches(targeting({ countries: ['IT'] }), visitor())).toBe(true)
    expect(adMatches(targeting({ countries: ['FR'] }), visitor())).toBe(false)
  })

  it('filtra per raggio intorno a una città', () => {
    const milano = { name: 'Milano', lat: 45.46, lng: 9.19, km: 50 }
    expect(adMatches(targeting({ places: [milano] }), visitor())).toBe(false)
    expect(adMatches(targeting({ places: [{ ...milano, km: 200 }] }), visitor())).toBe(true)
  })

  it('filtra per utenti collegati o ospiti', () => {
    expect(adMatches(targeting({ audience: 'users' }), visitor())).toBe(false)
    expect(adMatches(targeting({ audience: 'guests' }), visitor())).toBe(true)
  })

  it('rispetta la fascia oraria anche quando passa la mezzanotte', () => {
    expect(adMatches(targeting({ hours: { from: 9, to: 18 } }), visitor())).toBe(true)
    expect(adMatches(targeting({ hours: { from: 22, to: 2 } }), visitor())).toBe(false)
  })
})

describe('testo della campagna nella lingua di chi la vede', () => {
  const ad = {
    title: 'Crocchette -20%', body: '', cta: 'Scopri', url: 'https://example.it', defaultLang: 'it' as const,
    translations: { en: { title: 'Kibble -20%', body: '', cta: 'Discover', url: '' }, de: { title: 'Futter', body: '', cta: '', url: '' } },
  }
  it('usa la traduzione completa', () => {
    expect(adTextFor(ad, 'en')).toMatchObject({ title: 'Kibble -20%', lang: 'en', url: 'https://example.it' })
  })
  it('se la traduzione è incompleta usa la lingua predefinita', () => {
    expect(adTextFor(ad, 'de')).toMatchObject({ title: 'Crocchette -20%', lang: 'it' })
  })
})
