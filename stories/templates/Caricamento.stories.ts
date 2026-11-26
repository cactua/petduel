import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DefaultLayout from '@core/app/layouts/default.vue'
import UploadPage from '@core/app/pages/upload.vue'
import { challengeList, notifications, profile, USER } from '../fixtures'

const limits = (l: Partial<{ maxPetsPerUser: number | null, maxPhotosPerPet: number | null, uploadsOpen: boolean }> = {}) =>
  ({ maxPetsPerUser: null, maxPhotosPerPet: null, uploadsOpen: true, signupsOpen: true, exempt: false, ...l })

const api = (l = limits()) => ({
  '/api/users/giulia': profile({ isMe: true }),
  '/api/limits': l,
  '/api/notifications': notifications(),
  '/api/me/avatar': { id: null },
  '/api/challenges': challengeList(),
})

const meta = {
  title: 'Template/Caricamento',
  tags: ['autodocs'],
  render: () => ({ components: { DefaultLayout, UploadPage }, template: '<DefaultLayout><UploadPage /></DefaultLayout>' }),
  decorators: [() => ({ template: '<div id="__nuxt"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    route: '/upload',
    user: USER,
    state: { 'cookie:consent': 'none' },
    api: api(),
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: {
        component: 'Pagina `/upload`: per chi (una voce esistente o una nuova), l\'immagine, i dati. Con i limiti delle Impostazioni admin '
          + 'un avviso in alto dice quanti se ne possono ancora caricare; le scelte piene restano visibili ma spente, con il conteggio (2/3).',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const SenzaLimiti: Story = { name: 'Senza limiti', globals: { site: 'furry' } }
export const LimitiRaggiunti: Story = {
  name: 'Limiti raggiunti',
  globals: { site: 'furry' },
  parameters: { api: api(limits({ maxPetsPerUser: 2, maxPhotosPerPet: 3 })) },
}
export const CaricamentiChiusi: Story = {
  name: 'Caricamenti chiusi',
  globals: { site: 'furry' },
  parameters: { api: api(limits({ uploadsOpen: false })) },
}
