import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetTile from '@core/app/components/molecules/PetTile.vue'
import { entries, entry } from '../fixtures'

const p = entry(0)

const meta = {
  title: 'Molecole/PetTile',
  component: PetTile,
  tags: ['autodocs'],
  args: { id: p.id, name: p.name, image: p.image, owner: p.owner, credit: p.credit ?? null },
  argTypes: {
    id: { description: 'Id del partecipante: immagine e nome portano alla sua pagina (/pet/<id>, /character/<id> o /bike/<id> secondo il sito)' },
    name: { description: 'Nome, tagliato con i puntini se è lungo' },
    image: { description: 'Foto di base. Per le foto caricate (/img/<id>.webp) aggiunge da solo le varianti AVIF/WebP' },
    owner: { description: 'Chi l\'ha caricato: link al suo profilo' },
    credit: { description: 'Artista dell\'immagine (nome e link), se indicato' },
  },
  render: args => ({ components: { PetTile }, setup: () => ({ args }), template: '<ul style="list-style:none;padding:0;margin:0;width:190px"><PetTile v-bind="args" /></ul>' }),
  parameters: {
    docs: {
      description: {
        component: 'Riquadro di un partecipante nelle liste personali (Votati, Preferiti, Seguiti): immagine 3:4, nome, chi l\'ha caricato e l\'artista. '
          + 'È un `<li>`: va dentro una lista. Nello slot la pagina aggiunge righe extra con le classi `pet-tile__line` o `pet-tile__when`.',
      },
    },
  },
} satisfies Meta<typeof PetTile>
export default meta
type Story = StoryObj<typeof meta>

export const Riquadro: Story = {}
export const SenzaArtista: Story = { args: { credit: null } }
export const ConRigaExtra: Story = {
  name: 'Con riga nello slot',
  render: args => ({ components: { PetTile }, setup: () => ({ args }), template: '<ul style="list-style:none;padding:0;margin:0;width:190px"><PetTile v-bind="args"><small class="pet-tile__when">votato 2 ore fa</small></PetTile></ul>' }),
}
export const Griglia: Story = {
  render: () => ({
    components: { PetTile },
    setup: () => ({ list: entries(6) }),
    template: `<ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px">
      <PetTile v-for="p in list" :key="p.id" :id="p.id" :name="p.name" :image="p.image" :owner="p.owner" :credit="p.credit ?? null" />
    </ul>`,
  }),
}
