import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SonaSheet from '@core/app/components/organisms/SonaSheet.vue'
import { gallery, USER } from '../fixtures'

const meta = {
  title: 'Organismi/SonaSheet (furry)',
  component: SonaSheet,
  tags: ['autodocs'],
  globals: { site: 'furry' },
  args: { pet: gallery(0, { sona: true }), editable: false },
  argTypes: {
    pet: { description: 'Personaggio con la sua scheda (`pet.sona`)' },
    editable: { description: 'È tuo: puoi compilare e modificare la scheda' },
    onChanged: { action: 'changed' },
  },
  decorators: [() => ({ template: '<div style="max-width:760px"><story /></div>' })],
  parameters: {
    user: USER,
    api: { 'PUT /api/pets/*': {} },
    docs: {
      description: {
        component: 'Scheda del personaggio, solo sui siti con `site.sona` (**FurDuel**): reference, specie e pronomi, descrizione, tratti, colori da copiare con un tocco '
          + '(annunciato anche ai lettori di schermo) e regole per chi lo disegna (sì / no). Il proprietario la modifica qui; gli altri vedono solo le parti compilate.',
      },
    },
  },
} satisfies Meta<typeof SonaSheet>
export default meta
type Story = StoryObj<typeof meta>

export const Compilata: Story = {}
export const Proprietario: Story = { args: { editable: true } }
export const VuotaProprietario: Story = { name: 'Vuota (proprietario)', args: { pet: gallery(0), editable: true } }
