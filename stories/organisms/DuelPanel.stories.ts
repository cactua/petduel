import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DuelPanel from '@core/app/components/organisms/DuelPanel.vue'
import { AD_IMAGE, duelPair } from '../fixtures'

const meta = {
  title: 'Organismi/DuelPanel',
  component: DuelPanel,
  tags: ['autodocs'],
  args: { duel: { pets: duelPair(), token: 'demo' }, failed: false, votes: 3, hint: '', toast: '', result: null, celebrate: 0, ad: null },
  argTypes: {
    duel: { description: 'Duello da mostrare; null = caricamento. `pets: null` = finito (non c\'è più niente da votare)' },
    failed: { description: 'Caricamento fallito: messaggio e "Riprova"' },
    votes: { description: 'Voti dati in questa visita (per il suggerimento di creare l\'account)' },
    hint: { description: 'Suggerimento sotto le card' },
    toast: { description: 'Avviso breve che compare e sparisce' },
    result: { description: 'Esito del voto appena dato' },
    celebrate: { description: 'Cambia per far partire la festa (coriandoli) dopo un traguardo' },
    ad: { description: 'Annuncio al posto del duello (vedi AdCard)' },
    emptyText: { description: 'Testo quando i duelli sono finiti, al posto di quello di default' },
    onVote: { action: 'vote' },
    onSkip: { action: 'skip' },
    onRetry: { action: 'retry' },
    onAdContinue: { action: 'adContinue' },
  },
  decorators: [() => ({ template: '<div style="display:flex;flex-direction:column;height:min(720px,92vh)"><story /></div>' })],
  parameters: {
    docs: {
      story: { inline: false, iframeHeight: 760 },
      description: {
        component: 'L\'area di gioco della home e delle sfide con tutti i suoi stati: duello, caricamento, errore, duelli finiti, annuncio tra un duello e l\'altro, '
          + 'suggerimento e avviso. Barra spaziatrice = Salta; "?" apre la legenda delle scorciatoie. Lo slot `empty` sostituisce il messaggio dei duelli finiti.',
      },
    },
  },
} satisfies Meta<typeof DuelPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Duello: Story = {}
export const Caricamento: Story = { args: { duel: null } }
export const Errore: Story = { args: { duel: null, failed: true } }
export const Finiti: Story = { name: 'Duelli finiti', args: { duel: { pets: null, token: null } } }
export const ConSuggerimento: Story = { args: { hint: 'Trascina il preferito sopra l\'altro', toast: '+1 ♥ a ' + duelPair()[0].name } }
export const ConAnnuncio: Story = {
  args: { ad: { id: 1, advertiser: 'Negozio Esempio', title: 'Tutto per i tuoi compagni', body: 'Spedizione gratuita sopra i 30 €.', cta: 'Scopri', image: AD_IMAGE, href: 'https://example.com' } },
}
export const Festa: Story = { args: { celebrate: 1, result: { index: 1, delta: 1 } } }
