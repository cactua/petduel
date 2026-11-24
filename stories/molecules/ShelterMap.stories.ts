import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

// Componente del layer shelters: esiste solo su PetDuel, si usa per nome (registrato come in Nuxt)
const meta = {
  title: 'Molecole/ShelterMap (rifugi)',
  tags: ['autodocs'],
  globals: { site: 'pets' },
  args: { lat: 45.0703, lng: 7.6869, editable: false, label: 'Mappa del Rifugio Esempio' },
  argTypes: {
    lat: { control: { type: 'number', step: 0.01 }, description: 'Latitudine del segnaposto; null = niente segnaposto (si vede l\'Italia)' },
    lng: { control: { type: 'number', step: 0.01 }, description: 'Longitudine' },
    editable: { description: 'Un tocco sulla mappa (o trascinare il segnaposto) sposta il punto ed emette `pick`' },
    label: { description: 'Nome accessibile della mappa' },
  },
  render: args => ({
    setup: () => ({ args, point: ref<[number, number] | null>(null) }),
    template: `<div style="display:grid;gap:8px;max-width:620px">
      <div style="height:300px;border-radius:22px;overflow:hidden"><ShelterMap :lat="args.lat" :lng="args.lng" :editable="args.editable" :label="args.label" @pick="(a, b) => point = [a, b]" /></div>
      <p v-if="point" class="hint">pick: {{ point }}</p>
    </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Mappa OpenStreetMap (Leaflet, caricato solo nel browser) con il segnaposto a goccia del colore del rifugio (`--accent`). '
          + 'Riempie il contenitore (minimo 220px). Solo su **PetDuel**, che include il layer `shelters`.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const ConSegnaposto: Story = {}
export const SenzaPosizione: Story = { args: { lat: null as unknown as number, lng: null as unknown as number } }
export const Modificabile: Story = { args: { editable: true } }
