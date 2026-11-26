import type { Meta, StoryObj } from '@storybook/vue3-vite'
import EmailVerifyBar from '@core/app/components/organisms/EmailVerifyBar.vue'
import { USER } from '../fixtures'

const meta = {
  title: 'Organismi/EmailVerifyBar',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    user: { ...USER, emailVerified: false },
    apiDelay: 700,
    docs: {
      story: { inline: false, iframeHeight: 460 },
      description: {
        component: 'Promemoria in cima alle pagine finché l\'email dell\'account non è confermata (`user.emailVerified === false`). '
          + '**Mandalo di nuovo** chiede un altro link (`POST /api/me/verify-email`) e com\'è andata lo dice una modale: '
          + 'il focus va su Chiudi, si chiude anche con Esc o cliccando fuori. **Nascondi** lo toglie per questa visita.',
      },
    },
  },
  render: () => ({ components: { EmailVerifyBar }, template: '<div style="min-height:420px"><EmailVerifyBar /></div>' }),
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Inviata: Story = {
  name: 'Link rimandato',
  parameters: { api: { 'POST /api/me/verify-email': { ok: true } } },
}

export const TroppeRichieste: Story = {
  name: 'Errore: troppe richieste',
  parameters: { api: { 'POST /api/me/verify-email': { __error: 429, message: 'errors.tooManyRequests' } } },
}

export const ServizioEmailFermo: Story = {
  name: 'Errore: servizio email non disponibile',
  parameters: { api: { 'POST /api/me/verify-email': { __error: 503, message: 'errors.mailUnavailable' } } },
}
