import { describe, expect, it } from 'vitest'
import { licenseUrl } from '#shared/license'
import { reportSchema } from '#shared/models'
import type { LegalSection, LegalText, LegalTexts } from '../layers/core/app/legal/types'
import it_ from '../layers/core/app/legal/it'
import en from '../layers/core/app/legal/en'
import es from '../layers/core/app/legal/es'
import fr from '../layers/core/app/legal/fr'
import de from '../layers/core/app/legal/de'

// Testi legali, crediti delle foto libere e segnalazioni senza account

const tags = (list: LegalText[] | undefined) => (list ?? []).map(x => (typeof x === 'string' ? '*' : x.only.join('+')))
const shape = (t: LegalTexts) => Object.fromEntries(Object.entries(t.docs).map(([k, doc]) => [k, {
  intro: tags(Array.isArray(doc.intro) ? doc.intro : [doc.intro]),
  sections: doc.sections.map((s: LegalSection) => ({ only: s.only?.join('+') ?? '*', p: tags(s.p), list: tags(s.list), rows: s.table?.rows.length ?? 0 })),
}]))

describe('testi legali', () => {
  it('hanno le stesse parti per sito in tutte le lingue', () => {
    const base = shape(it_)
    for (const t of [en, es, fr, de]) expect(shape(t)).toEqual(base)
  })

  it('ogni sito ha la sua descrizione del servizio', () => {
    const service = it_.docs.terms.sections[0]!.p!
    for (const site of ['pets', 'furry', 'moto']) {
      expect(service.some(x => typeof x !== 'string' && x.only.includes(site as never))).toBe(true)
    }
  })
})

describe('licenze delle foto libere', () => {
  it('trova il link alla licenza Creative Commons', () => {
    expect(licenseUrl('Mario · CC BY-SA 4.0 · Wikimedia Commons')).toBe('https://creativecommons.org/licenses/by-sa/4.0/')
    expect(licenseUrl('Anna · CC BY 2.0 · Wikimedia Commons')).toBe('https://creativecommons.org/licenses/by/2.0/')
    expect(licenseUrl('Hans · CC BY-SA 2.0 de · Wikimedia Commons')).toBe('https://creativecommons.org/licenses/by-sa/2.0/de/')
    expect(licenseUrl('Ugo · CC0 · Wikimedia Commons')).toBe('https://creativecommons.org/publicdomain/zero/1.0/')
  })

  it('senza licenza CC non inventa link', () => {
    expect(licenseUrl('Ugo · Public domain · Wikimedia Commons')).toBeNull()
    expect(licenseUrl('@prova_luna_art')).toBeNull()
    expect(licenseUrl(null)).toBeNull()
  })
})

describe('segnalazioni senza account', () => {
  it('accettano email e dichiarazione di buona fede', () => {
    const r = reportSchema.safeParse({ target: 'photo', id: 3, reason: 'stolen', note: 'È un mio disegno', email: 'Artista@Example.test', goodFaith: true })
    expect(r.success && r.data.email).toBe('artista@example.test')
  })

  it('rifiutano un\'email sbagliata', () => {
    expect(reportSchema.safeParse({ target: 'photo', id: 3, reason: 'stolen', email: 'non-email' }).success).toBe(false)
  })
})
