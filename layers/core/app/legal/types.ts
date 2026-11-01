// Testi legali (privacy, cookie, termini) nelle 5 lingue del sito.
// {site} è il nome del sito (site.config.ts); {owner} ed {email} vengono dal file .env (NUXT_PUBLIC_LEGAL_OWNER, NUXT_PUBLIC_LEGAL_EMAIL).
// Sono una base di partenza: prima del lancio vanno fatti controllare da un legale.
export const LEGAL_UPDATED = '2026-10-31'

export type LegalKey = 'privacy' | 'cookie' | 'terms'

export interface LegalSection {
  h: string
  p?: string[]
  list?: string[]
  table?: { head: string[], rows: string[][] }
}

export interface LegalDoc {
  title: string
  intro: string
  sections: LegalSection[]
}

export interface LegalTexts {
  updated: string
  missing: string
  seeAlso: string
  docs: Record<LegalKey, LegalDoc>
}
