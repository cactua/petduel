import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DefaultLayout from '@core/app/layouts/default.vue'
import ProfilePage from '@core/app/pages/u/[username].vue'
import { artworks, challengeList, gallery, notifications, profile, USER } from '../fixtures'
import type { Profile } from '#shared/models'

// Un artista: disegni per altri e uno dei suoi personaggi, commissioni aperte
const artist = (isMe = false): Profile => {
  const p = profile({ artist: true, isMe })
  const own = gallery(0, { owner: isMe })
  return { ...p, artworks: [{ photoId: own.photos[0]!.id, petId: own.id, name: own.name, image: own.photos[0]!.image! }, ...artworks()] }
}

const api = (p: Profile) => ({
  '/api/users/giulia': p,
  'POST /api/users/giulia/follow': ({ body }: { body?: unknown }) => ({ following: (body as { following: boolean }).following }),
  'POST /api/users/giulia/block': {},
  '/api/notifications': notifications(),
  '/api/me/avatar': { id: null },
  '/api/challenges': challengeList(),
})

const meta = {
  title: 'Template/Pagina profilo',
  tags: ['autodocs'],
  render: () => ({
    components: { DefaultLayout, ProfilePage },
    template: '<DefaultLayout><ProfilePage /></DefaultLayout>',
  }),
  decorators: [() => ({ template: '<div id="__nuxt"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    // La pagina legge il nome da /u/<utente>
    route: '/u/giulia',
    user: null,
    state: { 'cookie:consenso': 'none' },
    api: api(artist()),
    docs: {
      story: { inline: false, iframeHeight: 820 },
      description: {
        component: 'Il profilo `/u/<utente>` (`pages/u/[username].vue`) come lo vede chi visita. Testata compatta: nome, una riga con "Artista · pronomi · personaggi", '
          + 'bio di tre righe con "Altro", commissioni aperte in un riquadro con "Chiedi", link dell\'artista; poi Segui, Condividi e il menu ⋯ con Segnala e Blocca. '
          + 'Sui siti con le sona (FurDuel) le schede restano in alto: un artista apre su **Disegni** (per altri e per i suoi personaggi), gli altri su **Personaggi**, '
          + 'una griglia che porta alla pagina di ognuno (scheda, immagini, gestione). Cuori, follower e voti dati li vede solo il proprietario. '
          + 'Cambia sito dalla barra per vedere PetDuel (lista dei partecipanti) e prova la vista telefono.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Artista: Story = { globals: { site: 'furry' } }
export const NonArtista: Story = { name: 'Non artista', globals: { site: 'furry' }, parameters: { api: api(profile()) } }
export const IlMioProfilo: Story = { name: 'Il mio profilo (artista)', globals: { site: 'furry' }, parameters: { user: USER, api: api(artist(true)) } }
export const Telefono: Story = { globals: { site: 'furry', viewport: { value: 'mobile2', isRotated: false } } }
