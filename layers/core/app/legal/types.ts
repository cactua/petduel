// Testi legali (privacy, cookie, termini, accessibilità) nelle 5 lingue del sito.
// {site} è il nome del sito (site.config.ts); {owner} ed {email} vengono dal file .env (NUXT_PUBLIC_LEGAL_OWNER, NUXT_PUBLIC_LEGAL_EMAIL).
// Sono una base di partenza: prima del lancio vanno fatti controllare da un legale.
// Un testo o una sezione con "only" si mostra solo sui siti che hanno almeno una di quelle etichette:
// l'id del sito (pets, furry, moto) o una funzione (shelters = rifugi, artists = artisti indicati, sona = schede dei personaggi)
export const LEGAL_UPDATED = '2026-11-24'

export type LegalTag = 'pets' | 'furry' | 'moto' | 'shelters' | 'artists' | 'sona'
export type LegalText = string | { only: LegalTag[], t: string }

export type LegalKey = 'privacy' | 'cookie' | 'terms' | 'accessibility'

export interface LegalSection {
  h: string
  only?: LegalTag[]
  p?: LegalText[]
  list?: LegalText[]
  table?: { head: string[], rows: string[][] }
}

export interface LegalDoc {
  title: string
  intro: LegalText | LegalText[]
  sections: LegalSection[]
}

export interface LegalTexts {
  updated: string
  missing: string
  seeAlso: string
  docs: Record<LegalKey, LegalDoc>
}
