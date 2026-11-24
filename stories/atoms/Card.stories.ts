import type { Meta, StoryObj } from '@storybook/vue3-vite'

interface CardArgs { compact: boolean, title: string, text: string }

const meta = {
  title: 'Atomi/Card (.card)',
  tags: ['autodocs'],
  render: args => ({
    setup: () => ({ args }),
    template: `<section :class="['card', args.compact && 'card--compact']" style="max-width:460px"><h3 style="margin-top:0">{{ args.title }}</h3><p style="margin-bottom:0">{{ args.text }}</p></section>`,
  }),
  args: { compact: false, title: 'Regole della community', text: 'Solo immagini tue o con il permesso di chi le ha fatte. Niente contenuti offensivi.' },
  argTypes: {
    compact: { description: '`card--compact`: meno spazio interno e angoli più piccoli' },
    title: { description: 'Contenuto d\'esempio' },
    text: { description: 'Contenuto d\'esempio' },
  },
  parameters: { docs: { description: { component: 'Atomo CSS (`atoms/_card.scss`): la superficie a scheda su cui poggiano quasi tutte le sezioni (sfondo `--surface`, angoli arrotondati, ombra morbida). Nei componenti c\'è anche il mixin `@include card(...)` con padding e raggio su misura.' } } },
} satisfies Meta<CardArgs>
export default meta
type Story = StoryObj<typeof meta>

export const Normale: Story = {}
export const Compatta: Story = { args: { compact: true } }
