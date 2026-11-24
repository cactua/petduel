import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import CropFrame from '@core/app/components/molecules/CropFrame.vue'
import type { Crop } from '#shared/images'
import { entry } from '../fixtures'

const meta = {
  title: 'Molecole/CropFrame',
  component: CropFrame,
  tags: ['autodocs'],
  args: { src: entry(0).image, ratio: 1, label: 'Sposta la foto nella cornice' },
  argTypes: {
    src: { description: 'Immagine da ritagliare' },
    ratio: { control: { type: 'number', step: 0.25 }, description: 'Proporzioni fisse della cornice (larghezza / altezza)' },
    initial: { description: 'Ritaglio di partenza, in frazioni dell\'immagine' },
    label: { description: 'Nome accessibile della cornice (role="application")' },
  },
  render: args => ({
    components: { CropFrame },
    setup: () => ({ args, crop: ref<Crop | null>(null), zoom: ref(1) }),
    template: `<div style="display:grid;gap:12px;max-width:360px">
      <div :style="{ aspectRatio: String(args.ratio), borderRadius: '18px', overflow: 'hidden' }">
        <CropFrame v-model:crop="crop" v-model:zoom="zoom" :src="args.src" :ratio="args.ratio" :initial="args.initial" :label="args.label" />
      </div>
      <input v-model.number="zoom" type="range" min="1" max="4" step="0.01" aria-label="Ingrandimento">
      <code style="font-size:12px">{{ crop && Object.fromEntries(Object.entries(crop).map(([k, v]) => [k, +v.toFixed(3)])) }}</code>
    </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Cornice di ritaglio con proporzioni fisse: si trascina l\'immagine per spostarla e si ingrandisce con la barra (fuori, `v-model:zoom`), la rotellina, '
          + 'due dita o i tasti (frecce, + e -). Riempie il contenitore, che decide forma e misura. Restituisce il ritaglio in frazioni dell\'immagine (`v-model:crop`).',
      },
    },
  },
} satisfies Meta<typeof CropFrame>
export default meta
type Story = StoryObj<typeof meta>

export const Quadrata: Story = {}
export const Verticale: Story = { args: { ratio: 3 / 4 } }
export const Orizzontale: Story = { args: { ratio: 3 / 2 } }
export const ConRitaglioIniziale: Story = { args: { initial: { x: 0.2, y: 0.1, w: 0.5, h: 0.5 } } }
