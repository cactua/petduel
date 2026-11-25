import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import PhotoViewer, { type ViewerPhoto } from '@core/app/components/molecules/PhotoViewer.vue'
import { entries, USER } from '../fixtures'

const photos: ViewerPhoto[] = entries(4).map(p => ({ image: p.image, alt: p.name, credit: p.credit, id: p.photoId }))

const meta = {
  title: 'Molecole/PhotoViewer',
  component: PhotoViewer,
  tags: ['autodocs'],
  args: { photos, peek: false, modelValue: 0 },
  argTypes: {
    photos: { description: 'Foto da sfogliare: immagine, testo alternativo, artista e id (se c\'è, compare "Segnala")' },
    peek: { description: 'Modalità "tieni premuto" dei duelli: solo da guardare, niente pulsanti; la chiude chi l\'ha aperta' },
    modelValue: { control: { type: 'number', min: 0, max: 3 }, description: 'Indice della foto aperta (v-model); null = chiuso' },
  },
  render: args => ({
    components: { PhotoViewer },
    setup: () => ({ args, index: ref<number | null>(args.modelValue ?? null) }),
    template: `<div>
      <button class="btn btn--primary" @click="index = 0">Apri il visore</button>
      <PhotoViewer v-model="index" :photos="args.photos" :peek="args.peek" />
    </div>`,
  }),
  parameters: {
    layout: 'fullscreen',
    user: USER,
    docs: {
      story: { inline: false, iframeHeight: 520 },
      description: {
        component: 'Foto a tutto schermo, intera e senza ritagli (finisce in `<body>` con Teleport). Con più foto si sfoglia con le frecce, i tasti ← → o uno swipe; '
          + 'verso il basso o Esc si chiude e il focus torna dove era. Sotto: numero della foto, artista e "Segnala". '
          + 'L\'artista con un link è un bottone: → porta al suo profilo sul sito (e chiude il visore), ↗ apre il sito esterno; senza link è solo il nome.',
      },
    },
  },
} satisfies Meta<typeof PhotoViewer>
export default meta
type Story = StoryObj<typeof meta>

export const Aperto: Story = {}
export const UnaSolaFoto: Story = { args: { photos: photos.slice(0, 1) } }
export const TieniPremuto: Story = { name: 'Tieni premuto (peek)', args: { peek: true } }
export const ArtistaDelSito: Story = {
  name: 'Artista del sito',
  args: { photos: [{ ...photos[0]!, credit: { text: 'lupo_art', url: '/u/lupo_art' } }] },
}
export const ArtistaSenzaLink: Story = {
  name: 'Artista senza link',
  args: { photos: [{ ...photos[0]!, credit: { text: 'Un amico', url: null } }] },
}
export const Chiuso: Story = { args: { modelValue: null as unknown as number } }
