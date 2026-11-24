import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import AdImageEditor from '@core/app/components/organisms/AdImageEditor.vue'
import AdInsights from '@core/app/components/organisms/AdInsights.vue'
import type { AdCrop } from '#shared/models'
import { AD_IMAGE, adminAd } from '../fixtures'

const meta = {
  title: 'Organismi/Campagne (admin)',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Organismi della pagina `/admin/ads`.\n\n'
          + '- **AdImageEditor**: posizione e dimensione dell\'immagine nella cornice 4:3 dell\'annuncio. Si sposta trascinando, si ingrandisce con la barra, '
          + 'la rotellina o due dita; rimpicciolita, attorno resta il colore di sfondo (utile per loghi e banner). `v-model` = ritaglio.\n'
          + '- **AdInsights**: dettaglio di una campagna: andamento per giorno, ore, provenienza, lingue, tetti, referente e note.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const EditorImmagine: Story = {
  name: 'AdImageEditor',
  render: () => ({
    components: { AdImageEditor },
    setup: () => ({ src: AD_IMAGE, crop: ref<AdCrop | null>(null) }),
    template: `<fieldset class="admin-form admin-form--tight card" style="max-width:480px;border:0">
      <AdImageEditor v-model="crop" :src="src" />
      <code class="hint">{{ crop }}</code>
    </fieldset>`,
  }),
}
export const EditorImmagineRitaglioSalvato: Story = {
  name: 'AdImageEditor (ritaglio salvato)',
  render: () => ({
    components: { AdImageEditor },
    setup: () => ({ src: AD_IMAGE, crop: ref<AdCrop | null>(null), initial: { x: -0.2, y: -0.1, w: 1.4, h: 1.4, bg: '#d7f2ff' } }),
    template: '<fieldset class="admin-form admin-form--tight card" style="max-width:480px;border:0"><AdImageEditor v-model="crop" :src="src" :initial="initial" /></fieldset>',
  }),
}
export const Statistiche: Story = {
  name: 'AdInsights',
  render: () => ({ components: { AdInsights }, setup: () => ({ ad: adminAd() }), template: '<div class="card" style="max-width:760px"><AdInsights :ad="ad" /></div>' }),
}
