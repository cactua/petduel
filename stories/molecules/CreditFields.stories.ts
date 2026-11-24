import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { reactive } from 'vue'
import CreditFields from '@core/app/components/molecules/CreditFields.vue'

type Credit = { credit: string, creditUrl: string, artist: string }

const meta = {
  title: 'Molecole/CreditFields',
  component: CreditFields,
  tags: ['autodocs'],
  args: { modelValue: { credit: '', creditUrl: '', artist: '' } },
  argTypes: { modelValue: { description: 'Artista (v-model, oggetto reactive del modulo): nome e link scritti a mano, oppure lo username di un artista registrato' } },
  render: args => ({
    components: { CreditFields },
    setup: () => ({ credit: reactive<Credit>({ ...args.modelValue }) }),
    template: '<div style="max-width:420px"><CreditFields v-model="credit" /><pre class="hint" style="margin-top:12px">{{ credit }}</pre></div>',
  }),
  parameters: {
    api: { '/api/artists': ({ query }: { query?: Record<string, unknown> }) => ['fennecart', 'fenrir_draws', 'foxglove.art'].filter(a => a.includes(String(query?.q ?? '').toLowerCase())) },
    docs: {
      description: {
        component: 'Chi ha creato l\'immagine, nei moduli di caricamento dei siti con `askCredit` (FurDuel). Mentre si scrive il nome propone gli artisti registrati '
          + '(`/api/artists`, una richiesta per pausa nella scrittura): sceglierne uno lo collega al suo profilo, altrimenti restano nome e link facoltativi. '
          + 'Prova a scrivere "fen".',
      },
    },
  },
} satisfies Meta<typeof CreditFields>
export default meta
type Story = StoryObj<typeof meta>

export const Vuoto: Story = {}
export const NomeELink: Story = { args: { modelValue: { credit: 'Mara Draws', creditUrl: 'https://example.com/mara', artist: '' } } }
export const ArtistaRegistrato: Story = { args: { modelValue: { credit: '', creditUrl: '', artist: 'fennecart' } } }
