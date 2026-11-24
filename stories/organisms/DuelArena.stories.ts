import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DuelArena from '@core/app/components/organisms/DuelArena.vue'
import { duelPair } from '../fixtures'

const meta = {
  title: 'Organismi/DuelArena',
  component: DuelArena,
  tags: ['autodocs'],
  args: { pets: duelPair(), coach: false, result: null },
  argTypes: {
    pets: { description: 'I due partecipanti del duello' },
    coach: { description: 'Demo iniziale: la prima card accenna il gesto finché non si tocca qualcosa (non con *riduci movimento*)' },
    result: { description: 'Esito appena votato: quale card ha vinto e quanti cuori ha preso ("+1 ♥")' },
    onVote: { action: 'vote', description: 'Voto: indice (0 o 1) del preferito' },
  },
  // Come nella home: l'arena riempie l'altezza che le lascia la pagina
  decorators: [() => ({ template: '<div style="display:flex;flex-direction:column;height:min(680px,90vh)"><story /></div>' })],
  parameters: {
    layout: 'padded',
    docs: {
      story: { inline: false, iframeHeight: 720 },
      description: {
        component: 'Le due card del duello e il gesto per votare: **si trascina il preferito sopra l\'altro** (giù/su su telefono, destra/sinistra su computer); '
          + 'clic e tocchi senza trascinamento non votano. Tenendo premuto la foto si apre intera. Da tastiera: le frecce votano, 1 e 2 tenuti premuti ingrandiscono. '
          + 'Su BikeDuel le card sono larghe (3:2, `site.wideMedia`), su PetDuel compaiono le orecchie della specie.',
      },
    },
  },
} satisfies Meta<typeof DuelArena>
export default meta
type Story = StoryObj<typeof meta>

export const Duello: Story = {}
export const ConDemoDelGesto: Story = { args: { coach: true } }
export const DopoIlVoto: Story = { args: { result: { index: 0, delta: 1 } } }
export const Telefono: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
