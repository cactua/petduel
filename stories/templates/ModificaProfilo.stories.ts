import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { userEvent, within } from 'storybook/test'
import DefaultLayout from '@core/app/layouts/default.vue'
import AccountPage from '@core/app/pages/account.vue'
import { challengeList, notifications, profile, USER } from '../fixtures'
import type { ArtistSettings, Profile } from '#shared/models'

// Il proprio profilo: artista con commissioni aperte e tre pagine social, o un utente qualsiasi
const me = (artist: boolean): Profile => ({ ...profile({ isMe: true, artist }), pronouns: artist ? 'lei/loro' : 'lei/lei' })
const artistSettings = (artist: boolean): ArtistSettings => artist
  ? { isArtist: true, links: ['https://www.instagram.com/esempio', 'https://bsky.app/profile/esempio.bsky.social', 'https://www.furaffinity.net/user/esempio'], commissions: 'open', commissionsUrl: 'https://vgen.co/esempio' }
  : { isArtist: false, links: [], commissions: '', commissionsUrl: '' }

const api = (artist: boolean, extra: Record<string, unknown> = {}) => ({
  '/api/users/giulia': me(artist),
  '/api/me/artist': artistSettings(artist),
  'PUT /api/me/profile': ({ body }: { body?: unknown }) => body,
  'PUT /api/me/artist': ({ body }: { body?: unknown }) => body,
  '/api/me/blocks': ['troll_42'],
  '/api/me/totp': { enabled: false, recoveryLeft: 0, required: false },
  '/api/notifications': notifications(),
  '/api/me/avatar': { id: null },
  '/api/challenges': challengeList(),
  ...extra,
})

const meta = {
  title: 'Template/Modifica profilo',
  tags: ['autodocs'],
  render: () => ({
    components: { DefaultLayout, AccountPage },
    template: '<DefaultLayout><AccountPage /></DefaultLayout>',
  }),
  decorators: [() => ({ template: '<div id="__nuxt"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    route: '/account',
    user: USER,
    state: { 'cookie:consent': 'none' },
    api: api(false),
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: {
        component: 'La pagina `/account` (`pages/account.vue`) con l\'organismo **ProfileEditor**. In alto un indice che resta fermo mentre si scorre '
          + '(Profilo, Artista, Notifiche, Sicurezza, Privacy e dati, Elimina): la voce della sezione che si legge è evidenziata, e un pallino segnala '
          + 'le modifiche non salvate. Il profilo ha l\'**anteprima dal vivo** della testata di `/u/<utente>` (sopra sui telefoni, a destra e ferma sul computer), '
          + 'dove si cambiano anche avatar e banner. Bio con contatore, pronomi con suggerimenti; per l\'artista l\'interruttore, lo stato delle commissioni '
          + 'in tre schede (aperte, chiuse, non dirlo) con il link per chiederle, e le pagine social con il sito riconosciuto dal link (https:// aggiunto da solo), '
          + 'da riordinare o togliere. Gli errori compaiono accanto al campo quando lo si lascia, o tutti al salvataggio (il fuoco va al primo). '
          + 'Appena si cambia qualcosa compare in basso la barra "Modifiche non salvate" con Scarta e Salva; uscendo dalla pagina senza salvare viene chiesta conferma.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const UtenteNormale: Story = { name: 'Utente normale', globals: { site: 'furry' } }
export const Artista: Story = { globals: { site: 'furry' }, parameters: { api: api(true) } }
export const ArtistaTelefono: Story = {
  name: 'Artista (telefono)',
  globals: { site: 'furry', viewport: { value: 'mobile2', isRotated: false } },
  parameters: { api: api(true) },
}
export const UtenteTelefono: Story = {
  name: 'Utente normale (telefono)',
  globals: { site: 'furry', viewport: { value: 'mobile2', isRotated: false } },
}
// Link scritti male o doppi: premendo Salva gli errori compaiono accanto ai campi e il fuoco va al primo
export const LinkDaCorreggere: Story = {
  name: 'Artista con link da correggere',
  globals: { site: 'furry' },
  parameters: { api: api(true) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement)
    const url = await page.findByLabelText(/Dove chiederle|Where to ask/i)
    await userEvent.clear(url)
    await userEvent.type(url, 'vgen')
    await userEvent.click(await page.findByRole('button', { name: /Aggiungi un link|Add a link/i }))
    await userEvent.keyboard('https://www.instagram.com/esempio')
    await userEvent.click(await page.findByRole('button', { name: /Salva modifiche|Save changes/i }))
  },
}
export const ErroreDelServer: Story = {
  name: 'Errore nel salvataggio',
  globals: { site: 'furry' },
  parameters: { api: api(true, { 'PUT /api/me/profile': { __error: 400, message: 'validation.check' }, 'PUT /api/me/artist': { __error: 400, message: 'validation.check' } }) },
}
// Sui siti senza artisti (PetDuel) restano bio e pronomi
export const PetDuel: Story = { name: 'PetDuel (senza artisti)', globals: { site: 'pets' } }
