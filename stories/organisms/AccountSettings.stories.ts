import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AccountSecurity from '@core/app/components/organisms/AccountSecurity.vue'
import ArtistSettings from '@core/app/components/organisms/ArtistSettings.vue'
import ProfileAbout from '@core/app/components/organisms/ProfileAbout.vue'
import { profile, USER } from '../fixtures'

// Nella pagina /account ognuno sta in una scheda con il suo titolo
const card = (title: string, inner: string) => `<article class="card" style="max-width:560px"><h2 style="margin-top:0;font-size:20px">${title}</h2>${inner}</article>`

const meta = {
  title: 'Organismi/Impostazioni dell\'account',
  tags: ['autodocs'],
  parameters: {
    user: USER,
    api: {
      '/api/users/giulia': profile({ isMe: true }),
      'PUT /api/me/profile': {},
      '/api/me/artist': { links: ['https://www.instagram.com/esempio'], commissionsUrl: '' },
      'PUT /api/me/artist': ({ body }: { body?: unknown }) => body,
      'POST /api/me/password': {},
      'DELETE /api/me/sessions': {},
    },
    docs: {
      description: {
        component: 'Organismi della pagina `/account`, ognuno con il suo salvataggio.\n\n'
          + '- **ProfileAbout**: bio e pronomi del proprio profilo.\n'
          + '- **ArtistSettings**: segnarsi come artista e scegliere le pagine social e il link per le commissioni (solo sui siti con `askCredit`, cioè FurDuel).\n'
          + '- **AccountSecurity**: cambio password (con quella attuale) ed "Esci da tutti gli altri dispositivi"; in tutti e due i casi le altre sessioni smettono di valere.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Bio: Story = { name: 'ProfileAbout', render: () => ({ components: { ProfileAbout }, template: card('Su di te', '<ProfileAbout />') }) }
export const Artista: Story = { name: 'ArtistSettings', render: () => ({ components: { ArtistSettings }, template: card('🎨 Artista', '<ArtistSettings />') }) }
export const ArtistaNuovo: Story = {
  name: 'ArtistSettings (non ancora artista)',
  parameters: { api: { '/api/me/artist': { links: [], commissionsUrl: '' } } },
  render: () => ({ components: { ArtistSettings }, template: card('🎨 Artista', '<ArtistSettings />') }),
}
export const Sicurezza: Story = { name: 'AccountSecurity', render: () => ({ components: { AccountSecurity }, template: card('🔒 Sicurezza', '<AccountSecurity />') }) }
export const SicurezzaErrore: Story = {
  name: 'AccountSecurity (password sbagliata)',
  parameters: { api: { 'POST /api/me/password': { __error: 400, message: 'errors.wrongPassword' } } },
  render: () => ({ components: { AccountSecurity }, template: card('🔒 Sicurezza', '<AccountSecurity />') }),
}
