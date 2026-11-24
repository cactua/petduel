import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ArtistWorks from '@core/app/components/organisms/ArtistWorks.vue'
import ProfileMedia from '@core/app/components/organisms/ProfileMedia.vue'
import { artworks, profile, USER } from '../fixtures'

const meta = {
  title: 'Organismi/Profilo',
  tags: ['autodocs'],
  parameters: {
    user: USER,
    api: { 'PUT /api/me/profile-image': {}, 'POST /api/pets/*': { photoId: 999 }, 'DELETE /api/me/credits/*': {} },
    docs: {
      description: {
        component: 'Organismi della pagina del profilo `/u/<utente>`.\n\n'
          + '- **ProfileMedia**: banner e avatar. Sul proprio profilo, passando sopra (sempre sui telefoni) compare l\'icona per cambiarli: si modifica sul posto '
          + 'trascinando l\'immagine nella cornice, scegliendo tra le proprie immagini o caricandone una nuova (che va in revisione). Nello slot: nome e sottotitolo.\n'
          + '- **ArtistWorks**: immagini caricate da altri che indicano questa persona come artista; sul proprio profilo si può togliere il proprio nome '
          + '("non sono io") o segnalare un caricamento senza permesso.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const names = '<div><h1 style="margin:0">@giulia</h1><p class="u-muted" style="margin:0">lei/lei · dal 2026</p></div>'

export const Media: Story = {
  name: 'ProfileMedia (di un altro)',
  render: () => ({ components: { ProfileMedia }, setup: () => ({ p: profile() }), template: `<header class="card" style="max-width:760px"><ProfileMedia :profile="p">${names}</ProfileMedia></header>` }),
}
export const MediaMio: Story = {
  name: 'ProfileMedia (il mio)',
  render: () => ({ components: { ProfileMedia }, setup: () => ({ p: profile({ isMe: true }) }), template: `<header class="card" style="max-width:760px"><ProfileMedia :profile="p">${names}</ProfileMedia></header>` }),
}
export const Lavori: Story = {
  name: 'ArtistWorks',
  render: () => ({ components: { ArtistWorks }, setup: () => ({ a: artworks() }), template: '<section class="card" style="max-width:760px"><ArtistWorks :artworks="a" :is-me="false" /></section>' }),
}
export const LavoriMiei: Story = {
  name: 'ArtistWorks (sul mio profilo)',
  render: () => ({ components: { ArtistWorks }, setup: () => ({ a: artworks() }), template: '<section class="card" style="max-width:760px"><ArtistWorks :artworks="a" is-me /></section>' }),
}
