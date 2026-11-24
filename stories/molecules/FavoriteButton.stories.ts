import type { Meta, StoryObj } from '@storybook/vue3-vite'
import FavoriteButton from '@core/app/components/molecules/FavoriteButton.vue'
import { USER } from '../fixtures'

const toggle = ({ body }: { body?: unknown }) => ({ saved: (body as { saved: boolean }).saved })

const meta = {
  title: 'Molecole/FavoriteButton',
  component: FavoriteButton,
  tags: ['autodocs'],
  args: { petId: 1 },
  argTypes: { petId: { description: 'Partecipante da salvare' } },
  parameters: {
    user: USER,
    api: { 'GET /api/pets/1/favorite': { saved: false }, 'POST /api/pets/1/favorite': toggle },
    docs: {
      description: {
        component: 'Salva un partecipante tra i Preferiti (`/favorites`). È privato: il proprietario non lo sa. Lo stato arriva da `GET /api/pets/<id>/favorite`, '
          + 'il tocco lo cambia con `POST`. Chi non ha fatto l\'accesso viene mandato al login (con ritorno alla pagina).',
      },
    },
  },
} satisfies Meta<typeof FavoriteButton>
export default meta
type Story = StoryObj<typeof meta>

export const DaSalvare: Story = {}
export const Salvato: Story = { parameters: { api: { 'GET /api/pets/1/favorite': { saved: true }, 'POST /api/pets/1/favorite': toggle } } }
export const Visitatore: Story = { parameters: { user: null } }
