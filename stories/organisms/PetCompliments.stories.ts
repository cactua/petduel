import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetCompliments from '@core/app/components/organisms/PetCompliments.vue'
import { compliments, USER } from '../fixtures'

const meta = {
  title: 'Organismi/PetCompliments',
  component: PetCompliments,
  tags: ['autodocs'],
  args: { petId: 1 },
  argTypes: { petId: { description: 'Partecipante a cui fare i complimenti' } },
  decorators: [() => ({ template: '<div style="max-width:560px"><story /></div>' })],
  parameters: {
    user: USER,
    api: { 'GET /api/pets/1/compliments': compliments(), 'POST /api/pets/1/compliments': {} },
    docs: {
      description: {
        component: 'Complimenti già pronti al posto dei commenti (😍 ✨ 🎨 😊 💡, testi adattati da ogni sito): niente testo libero, quindi niente insulti. '
          + 'Chi li fa vede solo i propri; proprietario e artista vedono quanti ne sono arrivati. Chi non ha l\'account viene mandato al login.',
      },
    },
  },
} satisfies Meta<typeof PetCompliments>
export default meta
type Story = StoryObj<typeof meta>

export const DaFare: Story = { name: 'Chi guarda' }
export const Proprietario: Story = { parameters: { api: { 'GET /api/pets/1/compliments': compliments({ owner: true }) } } }
export const Visitatore: Story = { parameters: { user: null, api: { 'GET /api/pets/1/compliments': { mine: [], counts: null, canGive: true } } } }
