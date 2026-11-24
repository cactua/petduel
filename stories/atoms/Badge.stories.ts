import type { Meta, StoryObj } from '@storybook/vue3-vite'

interface BadgeArgs { label: string, variant: '' | 'ok' | 'wait' | 'soft' | 'action' }

const meta = {
  title: 'Atomi/Badge (.badge)',
  tags: ['autodocs'],
  render: args => ({ setup: () => ({ args }), template: `<span :class="['badge', args.variant && 'badge--' + args.variant]">{{ args.label }}</span>` }),
  args: { label: '⏳ In revisione', variant: 'wait' },
  argTypes: {
    label: { description: 'Testo (anche con emoji)' },
    variant: { control: 'select', options: ['', 'ok', 'wait', 'soft', 'action'], description: 'Senza variante: neutra. `ok` verificato/approvato, `wait` in attesa, `soft` evidenza leggera, `action` colore delle azioni' },
  },
  parameters: { docs: { description: { component: 'Atomo CSS (`atoms/_badge.scss`): piccola pillola per stati, verifiche e conteggi. Non è cliccabile: per le scelte si usa `.chip`.' } } },
} satisfies Meta<BadgeArgs>
export default meta
type Story = StoryObj<typeof meta>

export const InAttesa: Story = {}
export const Approvato: Story = { args: { label: '✓ Verificato', variant: 'ok' } }
export const Tutte: Story = {
  render: () => ({
    template: `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <span class="badge">Neutra</span><span class="badge badge--ok">✓ Approvata</span><span class="badge badge--wait">⏳ In revisione</span>
      <span class="badge badge--soft">🏠 Cerca casa</span><span class="badge badge--action">3 nuove</span>
    </div>`,
  }),
}
