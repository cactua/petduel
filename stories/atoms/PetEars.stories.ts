import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetEars from '@core/app/components/atoms/PetEars.vue'
import { entry } from '../fixtures'

const SPECIES = ['cane', 'gatto', 'coniglio', 'roditore', 'uccello', 'rettile', 'altro']

const meta = {
  title: 'Atomi/PetEars',
  component: PetEars,
  tags: ['autodocs'],
  args: { species: 'gatto' },
  argTypes: { species: { control: 'select', options: [...SPECIES, 'sportiva', ''], description: 'Categoria del partecipante. Solo quelle degli animali hanno orecchie: le altre (moto, personaggi) non disegnano niente' } },
  // Il genitore deve essere position: relative; --ear regola la misura
  render: args => ({
    components: { PetEars },
    setup: () => ({ args, img: entry(0).image }),
    template: `<div style="position:relative;width:180px;margin-top:40px;--ear:44px">
      <PetEars :species="args.species" />
      <img :src="img" alt="" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:22px">
    </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Orecchie (o ciuffo, o cresta) della specie appoggiate sopra la cornice della foto, nei duelli e in galleria. Il genitore deve avere `position: relative`; '
          + 'la misura si regola con la variabile `--ear`. Solo per le categorie di PetDuel: su FurDuel e BikeDuel non compare niente.',
      },
    },
  },
} satisfies Meta<typeof PetEars>
export default meta
type Story = StoryObj<typeof meta>

export const Gatto: Story = {}
export const Cane: Story = { args: { species: 'cane' } }
export const Coniglio: Story = { args: { species: 'coniglio' } }
export const Tutte: Story = {
  render: () => ({
    components: { PetEars },
    setup: () => ({ list: SPECIES }),
    template: `<div style="display:flex;gap:28px;flex-wrap:wrap;padding-top:36px">
      <div v-for="s in list" :key="s" style="position:relative;width:96px;--ear:30px">
        <PetEars :species="s" /><div style="height:110px;border-radius:18px" :style="{ background: 'var(--t-' + s + ')' }"></div>
        <code style="font-size:12px">{{ s }}</code>
      </div>
    </div>`,
  }),
}
