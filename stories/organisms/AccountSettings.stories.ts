import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AccountSecurity from '@core/app/components/organisms/AccountSecurity.vue'
import ProfileEditor from '@core/app/components/organisms/ProfileEditor.vue'
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
      '/api/me/artist': { isArtist: true, links: ['https://www.instagram.com/esempio'], commissions: 'open', commissionsUrl: '' },
      'PUT /api/me/artist': ({ body }: { body?: unknown }) => body,
      'POST /api/me/password': {},
      'DELETE /api/me/sessions': {},
    },
    docs: {
      description: {
        component: 'Organismi della pagina `/account`, ognuno con il suo salvataggio.\n\n'
          + '- **ProfileEditor**: bio, pronomi e (solo sui siti con `askCredit`, cioè FurDuel) profilo da artista con commissioni e pagine social, '
          + 'con l\'anteprima della testata e un solo salvataggio. La pagina intera è in Template/Modifica profilo.\n'
          + '- **AccountSecurity**: cambio password (con quella attuale) ed "Esci da tutti gli altri dispositivi"; in tutti e due i casi le altre sessioni smettono di valere.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Profilo: Story = { name: 'ProfileEditor', globals: { site: 'furry' }, render: () => ({ components: { ProfileEditor }, template: '<ProfileEditor />' }) }
export const ProfiloNuovo: Story = {
  name: 'ProfileEditor (non ancora artista)',
  globals: { site: 'furry' },
  parameters: { api: { '/api/users/giulia': profile({ isMe: true }), '/api/me/artist': { isArtist: false, links: [], commissions: '', commissionsUrl: '' } } },
  render: () => ({ components: { ProfileEditor }, template: '<ProfileEditor />' }),
}
export const Sicurezza: Story = { name: 'AccountSecurity', render: () => ({ components: { AccountSecurity }, template: card('🔒 Sicurezza', '<AccountSecurity />') }) }
export const SicurezzaErrore: Story = {
  name: 'AccountSecurity (password sbagliata)',
  parameters: { api: { 'POST /api/me/password': { __error: 400, message: 'errors.wrongPassword' } } },
  render: () => ({ components: { AccountSecurity }, template: card('🔒 Sicurezza', '<AccountSecurity />') }),
}
