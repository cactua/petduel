import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ChallengeBanner from '@core/app/components/molecules/ChallengeBanner.vue'
import { challengeList } from '../fixtures'

const meta = {
  title: 'Molecole/ChallengeBanner',
  component: ChallengeBanner,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="max-width:560px"><story /></div>' })],
  parameters: {
    api: { '/api/challenges': challengeList() },
    docs: {
      description: {
        component: 'Striscia discreta in home che porta alla sfida della settimana senza disturbare i duelli. Legge `/api/challenges` solo nel browser; '
          + 'senza una sfida in corso non mostra niente.',
      },
    },
  },
} satisfies Meta<typeof ChallengeBanner>
export default meta
type Story = StoryObj<typeof meta>

export const ConSfida: Story = {}
export const SenzaSfida: Story = { parameters: { api: { '/api/challenges': { current: [], upcoming: [], past: [] } } } }
