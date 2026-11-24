// Anteprima delle storie: stili globali del nucleo, tema del sito scelto, lingue, sessione e API finte.
// Dalla barra in alto si scelgono sito (PetDuel, FurDuel, BikeDuel), lingua e tema chiaro/scuro;
// ogni storia può fissarli con `globals` e dare utente e risposte delle API con `parameters.user` e `parameters.api`
import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { defineComponent, h, Suspense } from 'vue'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '../layers/core/app/assets/scss/main.scss'
import furryTheme from '../sites/furry/app/assets/theme.scss?inline'
import motoTheme from '../sites/moto/app/assets/theme.scss?inline'
import { LANGUAGES } from '../layers/core/i18n/languages'
import { i18n, resetNuxtState, router, setStoryUser, useState, type StoryUser } from './nuxt/app'
import { registerNuxtComponents } from './nuxt/components'
import { setApiMocks, type ApiMocks } from './nuxt/fetch'
import { siteMessages } from './nuxt/messages'
import { loadedSiteId, SITES, type SiteId } from './nuxt/site'
import './preview.scss'

for (const [code, messages] of Object.entries(siteMessages(loadedSiteId))) i18n.global.setLocaleMessage(code, messages as never)

setup((app) => {
  app.use(i18n)
  app.use(router)
  registerNuxtComponents(app)
})

// Fogli di stile dei siti: come il css del loro nuxt.config, caricati dopo quello del nucleo
const THEMES: Record<SiteId, string> = { pets: '', furry: furryTheme, moto: motoTheme }
const style = document.createElement('style')
style.id = 'site-theme'
style.textContent = THEMES[loadedSiteId]
document.head.appendChild(style)

function applyScheme(scheme: string) {
  const html = document.documentElement
  // Come la scelta del tema dal menu dell'account: data-theme su <html>, senza = segue il sistema
  if (scheme === 'light' || scheme === 'dark') html.dataset.theme = scheme
  else delete html.dataset.theme
}

/** Il sito cambia: si ricarica l'anteprima con il nuovo sito nell'indirizzo (vedi .storybook/nuxt/site.ts) */
function reloadWithSite(globals: Record<string, unknown>) {
  const url = new URL(location.href)
  const encoded = Object.entries(globals).filter(([, v]) => typeof v === 'string').map(([k, v]) => `${k}:${v}`).join(';')
  url.searchParams.set('globals', encoded)
  try { sessionStorage.setItem('sb-site', String(globals.site)) }
  catch { /* storage non disponibile */ }
  location.replace(url)
}

declare module '@storybook/vue3-vite' {
  interface Parameters {
    /** Chi ha fatto l'accesso; null o assente = visitatore */
    user?: StoryUser | null
    /** Risposte finte delle API (vedi .storybook/nuxt/fetch.ts) */
    api?: ApiMocks
    /** Attesa finta delle API in ms (default 300) */
    apiDelay?: number
    /** Indirizzo della pagina in cui si trova il componente (per useRoute) */
    route?: string
    /** Valori iniziali di useState e useCookie (i cookie con chiave "cookie:<nome>") */
    state?: Record<string, unknown>
  }
}

const preview: Preview = {
  globalTypes: {
    site: {
      description: 'Sito: cambia configurazione (#site), palette, testi e componenti sostituiti',
      toolbar: {
        title: 'Sito',
        icon: 'globe',
        items: [
          { value: 'pets', title: '🐾 PetDuel (pets)' },
          { value: 'furry', title: '🦊 FurDuel (furry)' },
          { value: 'moto', title: '🏍️ BikeDuel (moto)' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Lingua dei testi',
      toolbar: {
        title: 'Lingua',
        icon: 'transfer',
        items: LANGUAGES.map(l => ({ value: l.code, title: l.name })),
        dynamicTitle: true,
      },
    },
    scheme: {
      description: 'Tema chiaro o scuro (data-theme su <html>)',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'system', title: 'Come il sistema' },
          { value: 'light', icon: 'sun', title: 'Chiaro' },
          { value: 'dark', icon: 'moon', title: 'Scuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { site: loadedSiteId, locale: 'it', scheme: 'light' },
  parameters: {
    layout: 'padded',
    controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /(At|Date)$/ } },
    docs: { toc: true },
    options: {
      storySort: {
        order: ['Introduzione', 'Fondamenta', 'Atomi', 'Molecole', 'Organismi', 'Template', '*'],
      },
    },
    a11y: { test: 'todo' },
  },
  decorators: [
    (story, context) => {
      const site = (context.globals.site ?? loadedSiteId) as SiteId
      if (site !== loadedSiteId && site in SITES) {
        reloadWithSite(context.globals)
        return defineComponent({ render: () => null })
      }
      const p = context.parameters
      i18n.global.locale.value = (context.globals.locale ?? 'it') as never
      applyScheme(context.globals.scheme ?? 'light')
      resetNuxtState()
      for (const [key, value] of Object.entries(p.state ?? {})) useState(key, () => value)
      setStoryUser(p.user)
      setApiMocks(p.api, p.apiDelay)
      void router.replace(p.route ?? '/')
      const key = `${site}-${context.globals.locale}-${context.id}`
      // Alcuni componenti aspettano i dati nel setup (await useFetch): Suspense come fa Nuxt nelle pagine
      return defineComponent({
        name: 'StoryFrame',
        setup: () => () => h(Suspense, null, { default: () => h('div', { key, class: 'sb-frame' }, [h(story())]) }),
      })
    },
  ],
}

export default preview
