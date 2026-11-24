import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

interface ChipArgs { label: string, pressed: boolean }

const meta = {
  title: 'Atomi/Chip (.chip, .segmented)',
  tags: ['autodocs'],
  render: args => ({ setup: () => ({ args }), template: '<button type="button" class="chip" :aria-pressed="args.pressed">{{ args.label }}</button>' }),
  args: { label: 'Questa settimana', pressed: false },
  argTypes: {
    label: { description: 'Testo della scelta' },
    pressed: { description: 'Scelta attiva: `aria-pressed="true"` (o `aria-checked`, o la classe `.is-active`). Colori invertiti' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Atomi CSS (`atoms/_chip.scss`). **`.chip`**: pillola selezionabile per filtri e scelte rapide; lo stato attivo si legge da `aria-pressed`, '
          + 'così è lo stesso per chi usa un lettore di schermo. **`.segmented`**: gruppo di opzioni a interruttore dentro una pillola (es. Aperte/Chiuse).',
      },
    },
  },
} satisfies Meta<ChipArgs>
export default meta
type Story = StoryObj<typeof meta>

export const Spenta: Story = {}
export const Attiva: Story = { args: { pressed: true } }
export const Gruppo: Story = {
  render: () => ({
    setup: () => ({ choice: ref('week'), opts: [['week', 'Settimana'], ['month', 'Mese'], ['all', 'Sempre'], ['new', 'Nuovi talenti']] }),
    template: `<div role="group" aria-label="Periodo" style="display:flex;gap:8px;flex-wrap:wrap">
      <button v-for="[v, l] in opts" :key="v" type="button" class="chip" :aria-pressed="choice === v" @click="choice = v">{{ l }}</button>
    </div>`,
  }),
}
export const Interruttore: Story = {
  name: 'Interruttore (.segmented)',
  render: () => ({
    setup: () => ({ choice: ref('open') }),
    template: `<div class="segmented" role="group" aria-label="Stato" style="display:inline-flex">
      <button type="button" class="segmented__option" :aria-pressed="choice === 'open'" @click="choice = 'open'">Aperte</button>
      <button type="button" class="segmented__option" :aria-pressed="choice === 'closed'" @click="choice = 'closed'">Chiuse</button>
    </div>`,
  }),
}
