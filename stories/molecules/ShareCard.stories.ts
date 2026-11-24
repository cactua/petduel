import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ShareCard from '@core/app/components/molecules/ShareCard.vue'
import { CARD_PET_ID, entry } from '../fixtures'

const meta = {
  title: 'Molecole/ShareCard',
  component: ShareCard,
  tags: ['autodocs'],
  args: { petId: CARD_PET_ID, petName: entry(0).name, autoOpen: false },
  argTypes: {
    petId: { description: 'Partecipante: la card è /card/<id>.png, disegnata dal server' },
    petName: { description: 'Nome nel titolo, nel testo condiviso e nel nome del file' },
    sfida: { control: 'text', description: 'Slug della sfida: card e link della sfida' },
    label: { description: 'Testo del pulsante al posto di "Condividi"' },
    autoOpen: { description: 'Si apre da sola (arrivando da un avviso di festa o dal riquadro in classifica)' },
  },
  decorators: [() => ({ template: '<div style="min-height:620px"><story /></div>' })],
  parameters: {
    // Il componente scarica la card come file per condividerla: qui torna un blob vuoto
    api: { '/card/*': new Blob([], { type: 'image/png' }) },
    docs: {
      description: {
        component: 'Condivide la card di un partecipante: anteprima, "Condividi" (con l\'immagine dove il telefono lo permette, altrimenti il link), '
          + '"Scarica" e "Copia link". L\'immagine si scarica all\'apertura, perché su iOS la condivisione deve partire subito dal tocco. '
          + 'Le card qui sono quelle vere generate dai siti in sviluppo.',
      },
    },
  },
} satisfies Meta<typeof ShareCard>
export default meta
type Story = StoryObj<typeof meta>

export const Pulsante: Story = {}
export const Aperta: Story = { args: { autoOpen: true } }
