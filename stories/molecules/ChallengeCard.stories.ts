import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ChallengeCard from '@core/app/components/molecules/ChallengeCard.vue'
import { challenges } from '../fixtures'

const [active, upcoming, ended] = challenges()

const meta = {
  title: 'Molecole/ChallengeCard',
  component: ChallengeCard,
  tags: ['autodocs'],
  args: { challenge: active!, big: false },
  argTypes: {
    challenge: { description: 'Sfida (ChallengeSummary): tema, date, stato (upcoming/active/ended), iscritti, vincitore e primi in classifica' },
    big: { description: 'In evidenza: descrizione, conto alla rovescia vivo, i primi tre e i pulsanti Vota/Partecipa' },
  },
  decorators: [() => ({ template: '<div style="max-width:560px"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component: 'Scheda di una sfida a tema, tutta cliccabile verso `/challenges/<slug>`. Il colore cambia con lo stato (`challenge-card--active`, `--upcoming`, `--ended`). '
          + 'Titolo e descrizione si traducono dallo slug (`themes.<slug>` nei file di lingua) o dalle traduzioni salvate. Il conto alla rovescia parte solo nel browser.',
      },
    },
  },
} satisfies Meta<typeof ChallengeCard>
export default meta
type Story = StoryObj<typeof meta>

export const InCorso: Story = {}
export const InEvidenza: Story = { args: { big: true } }
export const InArrivo: Story = { args: { challenge: upcoming! } }
export const Conclusa: Story = { args: { challenge: ended! } }
export const SoloAdozioni: Story = { args: { challenge: { ...active!, adoptionOnly: true } } }
