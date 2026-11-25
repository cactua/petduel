import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DefaultLayout from '@core/app/layouts/default.vue'
import HomePage from '@core/app/pages/index.vue'
import type { AdSlot, ShownAd } from '#shared/models'
import { AD_IMAGE, challengeList, entries, notifications, USER } from '../fixtures'

// Coppie diverse a ogni richiesta, come il server: si vede il passaggio da un duello all'altro
const pool = entries(8)
let turn = 0
const nextDuel = () => {
  const a = pool[turn % pool.length]!
  const b = pool[(turn + 1) % pool.length]!
  turn += 2
  return { pets: [a, b], token: `demo-${turn}` }
}

const CAMPAIGN: ShownAd = { id: 1, advertiser: 'Negozio Esempio', title: 'Tutto per i tuoi compagni', body: 'Spedizione gratuita sopra i 30 €, solo questa settimana.', cta: 'Scopri', image: AD_IMAGE, href: 'https://example.com' }

// Annuncio ogni 3 voti dall'inizio; con 2 voti già dati il primo voto lo fa comparire
const slot = (ad: ShownAd | null): AdSlot => ({ settings: { every: 3, startAfter: 0, inChallenges: true }, ad })
const api = (ad: ShownAd | null) => ({
  '/api/duel': nextDuel,
  'POST /api/vote': { delta: 1 },
  '/api/me/vote-count': { count: 2 },
  '/api/ads/next': slot(ad),
  'POST /api/ads/*': {},
  '/api/notifications': notifications(),
  '/api/me/avatar': { id: null },
  '/api/challenges': challengeList(),
})

const meta = {
  title: 'Template/Home con annunci',
  tags: ['autodocs'],
  render: () => ({
    components: { DefaultLayout, HomePage },
    template: '<DefaultLayout><HomePage /></DefaultLayout>',
  }),
  // Come in Nuxt: la pagina sta dentro #__nuxt, che occupa almeno tutta l'altezza
  decorators: [() => ({ template: '<div id="__nuxt"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    user: USER,
    state: { 'cookie:consenso': 'none' },
    api: api(CAMPAIGN),
    docs: {
      story: { inline: false, iframeHeight: 760 },
      description: {
        component: 'La home (`pages/index.vue`) dentro il layout, come la vede chi vota: **vota una volta** (trascina una card sull\'altra, o ← →) '
          + 'e al posto del duello compare l\'annuncio; "Continua" riporta ai duelli e il successivo arriva dopo altri 3 voti. '
          + 'Le API sono finte: coppie sempre nuove da `/api/duel`, 2 voti già dati, `/api/ads/next` con un annuncio ogni 3 voti. '
          + 'Sul sito il ritmo lo decide il pannello admin (Pubblicità: ogni quanti voti, da quale voto, anche nelle sfide).',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Campagna: Story = { name: 'Annuncio di una campagna' }
export const FaiPubblicita: Story = {
  name: 'Fai pubblicità qui (nessuna campagna)',
  parameters: { api: api({ house: true }) },
}
export const SenzaAnnunci: Story = {
  name: 'Annunci spenti',
  parameters: { api: { ...api(null), '/api/ads/next': { settings: { every: 0, startAfter: 0, inChallenges: true }, ad: null } } },
}
export const Telefono: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
