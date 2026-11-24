import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetRosette from '@core/app/components/atoms/PetRosette.vue'

const meta = {
  title: 'Atomi/PetRosette',
  component: PetRosette,
  tags: ['autodocs'],
  args: { place: 1 },
  argTypes: { place: { control: { type: 'number', min: 1, max: 10 }, description: 'Posizione: 1 oro, 2 argento, 3 (e oltre) bronzo' } },
  decorators: [() => ({ template: '<div style="width:64px"><story /></div>' })],
  parameters: { docs: { description: { component: 'Coccarda da esposizione con il numero del podio, usata in classifica e nelle sfide. Decorativa (`aria-hidden`): la posizione va scritta anche nel testo. La dimensione la decide il contenitore.' } } },
} satisfies Meta<typeof PetRosette>
export default meta
type Story = StoryObj<typeof meta>

export const Oro: Story = {}
export const Argento: Story = { args: { place: 2 } }
export const Bronzo: Story = { args: { place: 3 } }
export const Podio: Story = {
  render: () => ({ components: { PetRosette }, template: '<div style="display:flex;gap:16px"><div v-for="p in [1, 2, 3]" :key="p" style="width:56px"><PetRosette :place="p" /></div></div>' }),
}
