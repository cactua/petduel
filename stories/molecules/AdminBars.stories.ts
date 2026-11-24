import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AdminBars from '@core/app/components/molecules/AdminBars.vue'
import { lastDays } from '../fixtures'

const meta = {
  title: 'Molecole/AdminBars',
  component: AdminBars,
  tags: ['autodocs'],
  args: { title: 'Voti', days: lastDays(14, 900) },
  argTypes: {
    title: { description: 'Nome della serie (al posto della legenda)' },
    days: { description: 'Un valore per giorno, dal più vecchio a oggi ("YYYY-MM-DD")' },
    color: { control: 'color', description: 'Colore delle barre; di default --coral' },
  },
  decorators: [() => ({ template: '<div style="max-width:560px"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component: 'Grafico a barre per giorno del pannello admin: una serie sola, totale in alto a destra, il numero esatto passando sopra una barra '
          + '(o con il tab: ogni barra ha il suo `aria-label`).',
      },
    },
  },
} satisfies Meta<typeof AdminBars>
export default meta
type Story = StoryObj<typeof meta>

export const Voti: Story = {}
export const AltroColore: Story = { args: { title: 'Nuove foto', days: lastDays(14, 40), color: 'var(--mint)' } }
export const UnMese: Story = { args: { title: 'Iscritti', days: lastDays(30, 25), color: 'var(--sun-deep)' } }
