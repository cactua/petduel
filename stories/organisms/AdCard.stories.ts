import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AdCard from '@core/app/components/organisms/AdCard.vue'
import { AD_IMAGE } from '../fixtures'

const own = { id: 1, advertiser: 'Negozio Esempio', title: 'Tutto per i tuoi compagni', body: 'Spedizione gratuita sopra i 30 €, solo questa settimana.', cta: 'Scopri', image: AD_IMAGE, href: 'https://example.com' }

const meta = {
  title: 'Organismi/AdCard',
  component: AdCard,
  tags: ['autodocs'],
  args: { ad: own, preview: false, crop: null },
  argTypes: {
    ad: { description: 'Annuncio: di una campagna (immagine, titolo, testo, pulsante), del circuito Google (`{ network: "adsense" }`) o "fai pubblicità qui" (`{ house: true }`)' },
    preview: { description: 'Anteprima (admin, pagina Pubblicità): non conta la visualizzazione e il link non porta da nessuna parte' },
    crop: { description: 'Posizione dell\'immagine originale come nell\'editor (AdImageEditor), con colore di sfondo' },
    onContinue: { action: 'continue', description: 'Tocco su "Continua": si torna ai duelli' },
  },
  decorators: [() => ({ template: '<div style="display:flex;flex-direction:column;height:min(640px,90vh);max-width:560px"><story /></div>' })],
  parameters: {
    api: { 'POST /api/ads/*': {} },
    docs: {
      story: { inline: false, iframeHeight: 680 },
      description: {
        component: 'Pubblicità tra un duello e l\'altro: occupa il posto dell\'arena finché non si tocca "Continua", che arriva dopo un attimo '
          + '(chi stava trascinando non lo tocca per sbaglio). È sempre etichettata come pubblicità. Senza campagne in onda invita a fare pubblicità sul sito.',
      },
    },
  },
} satisfies Meta<typeof AdCard>
export default meta
type Story = StoryObj<typeof meta>

export const Campagna: Story = {}
export const Anteprima: Story = { args: { preview: true } }
export const ImmagineRimpicciolita: Story = { name: 'Immagine posizionata (crop)', args: { preview: true, crop: { x: -0.15, y: -0.1, w: 1.3, h: 1.3, bg: '#fff1b8' } } }
export const FaiPubblicita: Story = { name: 'Fai pubblicità qui', args: { ad: { house: true } } }
