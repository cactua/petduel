// Cosa cambia da un sito all'altro. Ogni sito lo scrive in sites/<nome>/site.config.ts e il codice lo legge da "#site".
// Etichette e testi delle categorie stanno nei file di lingua (species.<id>.one|many|among)

export interface SiteCategory {
  /** Valore salvato nel database, es. "gatto" */
  id: string
  /** Parte dell'indirizzo della classifica, es. "gatti" in /leaderboard/gatti */
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

/**
 * Colori e mascotte usati fuori dai fogli di stile: card da condividere (create sul server) e barra del browser su mobile.
 * Devono andare d'accordo con la palette del sito (in sites/<nome>/app/assets)
 */
export interface SiteBrand {
  /** Colore principale: logo, bottone e cornici delle card */
  accent: string
  /** Ombra colorata sotto i riquadri, di solito l'accento semitrasparente */
  glow: string
  /** Sfondo chiaro, anche della barra del browser */
  background: string
  ink: string
  muted: string
  /** Le tre macchie di colore sullo sfondo delle card */
  blobs: readonly [string, string, string]
  /**
   * La mascotte che fa le domande (pagine e card), come <svg> completo con viewBox "0 0 84 76".
   * Senza: il sito non ha mascotte
   */
  mascotSvg?: string
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
  /**
   * Chiede chi ha creato l'immagine quando si carica (nome e link dell'artista, facoltativi):
   * serve dove chi carica può non essere l'autore, come per i disegni
   */
  askCredit?: boolean
  /**
   * Razza e città dei partecipanti, facoltative per chi carica (la città serve anche alla classifica per città).
   * Se manca: sì. false le toglie da moduli e classifica
   */
  breedAndCity?: boolean
  /** Se manca valgono i colori e Biscotto del nucleo (DEFAULT_BRAND) */
  brand?: SiteBrand
  /**
   * Parola nell'indirizzo della pagina di un partecipante: /<entryPath>/<id>. Se manca: "pet".
   * Cambiandola, i vecchi indirizzi /pet/<id> portano a quelli nuovi
   */
  entryPath?: string
}

// Aspetto del nucleo: la palette chiara di layers/core/app/assets/scss e Biscotto, la mascotte
export const DEFAULT_BRAND: SiteBrand = {
  accent: '#ff6f61',
  glow: 'rgba(255,111,97,.55)',
  background: '#fff8f1',
  ink: '#4a2d1e',
  muted: '#a27e68',
  blobs: ['#ffd9e6', '#d7f2ff', '#fff1b8'],
  mascotSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 76"><ellipse cx="15" cy="34" rx="11" ry="20" fill="#b9814f" transform="rotate(20 15 34)"/><ellipse cx="69" cy="34" rx="11" ry="20" fill="#b9814f" transform="rotate(-20 69 34)"/><ellipse cx="42" cy="42" rx="28" ry="26" fill="#f6d7ae"/><ellipse cx="54" cy="35" rx="9" ry="8" fill="#e8b98a"/><circle cx="32" cy="40" r="4.2" fill="#3d2416"/><circle cx="52" cy="40" r="4.2" fill="#3d2416"/><circle cx="33.4" cy="38.5" r="1.4" fill="#fff"/><circle cx="53.4" cy="38.5" r="1.4" fill="#fff"/><ellipse cx="42" cy="50" rx="5" ry="3.6" fill="#3d2416"/><path d="M35 55q7 6 14 0" fill="none" stroke="#3d2416" stroke-width="2" stroke-linecap="round"/><ellipse cx="42" cy="60" rx="3.6" ry="4.6" fill="#ff7b8a"/><ellipse cx="25" cy="51" rx="5" ry="3" fill="#ffb3b3" opacity=".75"/><ellipse cx="59" cy="51" rx="5" ry="3" fill="#ffb3b3" opacity=".75"/><ellipse cx="28" cy="72" rx="9" ry="5" fill="#f6d7ae"/><ellipse cx="56" cy="72" rx="9" ry="5" fill="#f6d7ae"/></svg>',
}

export const siteBrand = (config: SiteConfig) => config.brand ?? DEFAULT_BRAND

export const defineSite = (config: SiteConfig) => config
