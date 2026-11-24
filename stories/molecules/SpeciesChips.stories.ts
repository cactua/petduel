import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import SpeciesChips from '@core/app/components/molecules/SpeciesChips.vue'
import site from '#site'

const meta = {
  title: 'Molecole/SpeciesChips',
  component: SpeciesChips,
  tags: ['autodocs'],
  argTypes: { modelValue: { control: 'select', options: [undefined, ...site.categories.map(c => c.id)], description: 'Categoria scelta (v-model); vuoto = tutte' } },
  render: args => ({
    components: { SpeciesChips },
    setup: () => ({ value: ref(args.modelValue), site }),
    template: `<div style="max-width:560px">
      <SpeciesChips v-model="value" />
      <p class="hint" style="margin-top:10px">Scelta: <b>{{ value ?? 'tutte' }}</b></p>
      <p v-if="!site.categories.length" class="hint">{{ site.name }} non ha categorie: la riga non c'è.</p>
    </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Filtro per categoria (duelli e classifiche): una riga di chip che scorre in orizzontale, con una sfumatura sul lato dove ci sono altre voci. '
          + 'Le categorie vengono da `site.config.ts` (PetDuel: animali, BikeDuel: tipi di moto); FurDuel non ne ha e la riga non compare. '
          + 'Su PetDuel ogni categoria ha la sua tinta (`--t-<categoria>`).',
      },
    },
  },
} satisfies Meta<typeof SpeciesChips>
export default meta
type Story = StoryObj<typeof meta>

export const Tutte: Story = {}
export const UnaScelta: Story = { args: { modelValue: site.categories[1]?.id } }
export const Stretta: Story = {
  name: 'Su telefono (scorre)',
  decorators: [() => ({ template: '<div style="max-width:320px"><story /></div>' })],
}
