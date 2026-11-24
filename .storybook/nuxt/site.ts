// Al posto di "#site": la configurazione del sito scelto nella barra di Storybook.
// Nel codice condiviso molte costanti si calcolano una volta sola dal sito (SPECIES, ENTRY_PATH, HAS_SONA… in
// shared/models.ts), come succede nell'app vera dove il sito non cambia mai. Per questo il sito si legge
// dall'indirizzo dell'anteprima prima di tutto il resto, e cambiarlo dalla barra ricarica l'anteprima
// (vedi preview.ts): ogni sito vede esattamente i valori che vedrebbe in produzione
import type { SiteConfig } from '../../layers/core/shared/site'
import pets from '../../sites/pets/site.config'
import furry from '../../sites/furry/site.config'
import moto from '../../sites/moto/site.config'

export const SITES = { pets, furry, moto } as const
export type SiteId = keyof typeof SITES
export const SITE_IDS = Object.keys(SITES) as SiteId[]

/** Siti che includono anche layers/shelters (rifugi e adozioni), come negli extends dei nuxt.config */
export const SITES_WITH_SHELTERS: readonly SiteId[] = ['pets']

/** I globals di Storybook nell'indirizzo dell'anteprima: "?globals=site:furry;locale:en" */
export function urlGlobals(href = location.href): Record<string, string> {
  const raw = new URL(href).searchParams.get('globals') ?? ''
  return Object.fromEntries(raw.split(';').filter(Boolean).map(p => p.split(':') as [string, string]))
}

function initialSite(): SiteId {
  const fromUrl = urlGlobals().site
  if (fromUrl && fromUrl in SITES) return fromUrl as SiteId
  try {
    const saved = sessionStorage.getItem('sb-site')
    if (saved && saved in SITES) return saved as SiteId
  }
  catch { /* storage non disponibile */ }
  return 'pets'
}

/** Il sito con cui sono stati caricati i moduli: resta quello fino al prossimo caricamento dell'anteprima */
export const loadedSiteId: SiteId = initialSite()
try { sessionStorage.setItem('sb-site', loadedSiteId) }
catch { /* storage non disponibile */ }

export const currentSiteId = () => loadedSiteId

const site: SiteConfig = { ...SITES[loadedSiteId] }
export default site
