import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AppIcon from '@core/app/components/atoms/AppIcon.vue'

const NAMES = ['paw', 'flag', 'podium', 'camera', 'face', 'share', 'login', 'shield', 'sun', 'moon', 'home', 'bell', 'auto', 'heart', 'star', 'sparkle'] as const

const meta = {
  title: 'Atomi/AppIcon',
  component: AppIcon,
  tags: ['autodocs'],
  args: { name: 'paw' },
  argTypes: {
    name: { control: 'select', options: NAMES, description: 'Quale icona disegnare' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Icone disegnate a mano, a tratto arrotondato (`components/atoms/AppIcon.vue`). Misurano 1.4em, quindi crescono con il testo intorno, '
          + 'e prendono il colore del testo (`currentColor`). Sono decorative (`aria-hidden`): il significato lo dà sempre il testo o l\'`aria-label` del pulsante.',
      },
    },
  },
} satisfies Meta<typeof AppIcon>
export default meta
type Story = StoryObj<typeof meta>

export const Zampa: Story = {}
export const Cuore: Story = { args: { name: 'heart' } }

export const Tutte: Story = {
  render: () => ({
    components: { AppIcon },
    setup: () => ({ names: NAMES }),
    template: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px">
      <div v-for="n in names" :key="n" class="card card--compact" style="display:grid;justify-items:center;gap:6px;font-size:22px">
        <AppIcon :name="n" /><code style="font-size:12px">{{ n }}</code>
      </div>
    </div>`,
  }),
}

export const ColoreEDimensione: Story = {
  name: 'Colore e dimensione dal testo',
  render: () => ({
    components: { AppIcon },
    template: `<div style="display:flex;gap:18px;align-items:center">
      <span style="font-size:14px"><AppIcon name="heart" /></span>
      <span style="font-size:24px;color:var(--heart)"><AppIcon name="heart" /></span>
      <span style="font-size:40px;color:var(--coral)"><AppIcon name="star" /></span>
    </div>`,
  }),
}
