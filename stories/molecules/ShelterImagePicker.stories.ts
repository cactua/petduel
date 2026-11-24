import type { Meta, StoryObj } from '@storybook/vue3-vite'

// Componente del layer shelters: esiste solo su PetDuel, si usa per nome (registrato come in Nuxt)
const meta = {
  title: 'Molecole/ShelterImagePicker (rifugi)',
  tags: ['autodocs'],
  globals: { site: 'pets' },
  args: { kind: 'banner', id: null },
  argTypes: {
    kind: { control: 'inline-radio', options: ['banner', 'logo'], description: 'Banner largo (5:2) o logo quadrato' },
    id: { control: 'text', description: 'Immagine già salvata (file da /shelter-img/); null = nessuna' },
  },
  render: args => ({ setup: () => ({ args }), template: '<div style="max-width:620px"><ShelterImagePicker :kind="args.kind" :id="args.id" /></div>' }),
  parameters: {
    api: { 'POST /api/shelters/me/image': { id: 'esempio' }, 'DELETE /api/shelters/me/image': {} },
    docs: {
      description: {
        component: 'Banner o logo del rifugio nell\'area del rifugio: si sceglie una foto, la si sposta nella cornice trascinandola e la si salva subito, '
          + 'senza aspettare il "Salva" del resto del modulo. Emette `change` con il nuovo id. Solo su **PetDuel**.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Banner: Story = {}
export const Logo: Story = { args: { kind: 'logo' } }
