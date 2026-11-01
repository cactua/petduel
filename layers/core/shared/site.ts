// Cosa cambia da un sito all'altro. Ogni sito lo scrive in sites/<nome>/site.config.ts e il codice lo legge da "#site".
// Etichette e testi delle categorie stanno nei file di lingua (species.<id>.one|many|among)

export interface SiteCategory {
  /** Valore salvato nel database, es. "gatto" */
  id: string
  /** Parte dell'indirizzo della classifica, es. "gatti" in /classifica/gatti */
  slug: string
  emoji: string
}

export interface ChallengeTheme {
  slug: string
  title: string
  emoji: string
  description: string
  /** Solo per una categoria */
  species?: string
}

export interface SiteConfig {
  id: string
  /** Nome del sito: logo, titoli delle pagine, card da condividere, testi legali ("@:site.name" nei file di lingua) */
  name: string
  /**
   * Categorie tra cui scegliere (duelli e classifiche restano dentro la stessa categoria).
   * Vuota: niente scelta, tutti i contenuti competono insieme
   */
  categories: readonly SiteCategory[]
  /**
   * Calendario automatico delle sfide: se un moderatore non ha programmato nulla, ogni settimana parte il tema successivo.
   * Titolo e descrizione restano in italiano nel database; il sito li traduce dallo slug (themes.<slug> nei file di lingua).
   * Vuoto: le sfide partono solo se le programma un moderatore
   */
  challengeThemes: readonly ChallengeTheme[]
}

export const defineSite = (config: SiteConfig) => config
