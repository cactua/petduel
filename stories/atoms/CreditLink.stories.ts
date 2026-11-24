import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CreditLink from '@core/app/components/atoms/CreditLink.vue'

const meta = {
  title: 'Atomi/CreditLink',
  component: CreditLink,
  tags: ['autodocs'],
  args: { url: '/u/fennecart' },
  argTypes: { url: { control: 'text', description: '"/u/…" artista registrato (link interno); "https://…" link scritto da chi carica (si apre fuori, senza follow); vuoto = solo il nome' } },
  render: args => ({ components: { CreditLink }, setup: () => ({ args }), template: '<CreditLink :url="args.url || null">🎨 @fennecart</CreditLink>' }),
  parameters: {
    docs: {
      description: {
        component: 'Link all\'autore di un\'immagine. Un artista registrato porta al suo profilo sul sito; un link esterno si apre in una nuova scheda con '
          + '`rel="noopener noreferrer nofollow ugc"` (è scritto dagli utenti); senza link resta solo il testo. Il contenuto (nome) arriva dallo slot.',
      },
    },
  },
} satisfies Meta<typeof CreditLink>
export default meta
type Story = StoryObj<typeof meta>

export const ArtistaRegistrato: Story = {}
export const LinkEsterno: Story = { args: { url: 'https://commons.wikimedia.org' } }
export const SoloNome: Story = { args: { url: '' } }
