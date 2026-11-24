import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetRankRow from '@core/app/components/molecules/PetRankRow.vue'
import { ranked } from '../fixtures'

const [first] = ranked(1)

const meta = {
  title: 'Molecole/PetRankRow',
  component: PetRankRow,
  tags: ['autodocs'],
  args: { pet: first!, score: '❤ 420', detail: 'Torino', mine: false, showSpecies: false },
  argTypes: {
    pet: { description: 'Partecipante in classifica (RankedPet): posizione, foto quadrata, nome, chi l\'ha caricato' },
    score: { description: 'Testo a destra: cuori o punti, già formattato' },
    detail: { description: 'Dopo "@utente ·": città, razza o altro' },
    mine: { description: 'È tuo: compare l\'etichetta "tuo"' },
    showSpecies: { description: 'Emoji della categoria prima del nome (classifica generale con più categorie)' },
    rankLabel: { control: 'text', description: 'Al posto del numero di posizione (es. posizione nella categoria, o un simbolo per chi è fuori dalla top)' },
  },
  decorators: [() => ({ template: '<div style="max-width:520px"><story /></div>' })],
  parameters: { docs: { description: { component: 'Riga della classifica: posizione, miniatura, nome con chi l\'ha caricato e il punteggio. Tutta la riga porta alla pagina del partecipante.' } } },
} satisfies Meta<typeof PetRankRow>
export default meta
type Story = StoryObj<typeof meta>

export const Riga: Story = {}
export const Tuo: Story = { args: { mine: true } }
export const ConCategoria: Story = { args: { showSpecies: true } }
export const FuoriDallaTop: Story = { args: { rankLabel: '…', score: 'mancano 12 ❤', mine: true } }
export const Classifica: Story = {
  render: () => ({
    components: { PetRankRow },
    setup: () => ({ list: ranked(5) }),
    template: '<div style="display:grid;gap:8px;max-width:520px"><PetRankRow v-for="p in list" :key="p.id" :pet="p" :score="`❤ ${p.score}`" :detail="p.city || p.breed" show-species /></div>',
  }),
}
