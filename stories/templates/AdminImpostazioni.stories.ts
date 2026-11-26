import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SettingsPage from '@core/app/pages/admin/settings.vue'
import { ADMIN } from '../fixtures'

const settings = { maxPetsPerUser: 3, maxPhotosPerPet: 10, maxPendingPerUser: 10, uploadsOpen: true, signupsOpen: true, maxSignupsPerNetwork: 8 }

const meta = {
  title: 'Template/Admin impostazioni',
  tags: ['autodocs'],
  render: () => ({ components: { SettingsPage }, template: '<SettingsPage />' }),
  parameters: {
    layout: 'padded',
    user: ADMIN,
    api: {
      '/api/admin/settings': settings,
      'PUT /api/admin/settings': ({ body }: { body?: unknown }) => body,
    },
    docs: {
      story: { inline: false, iframeHeight: 1000 },
      description: {
        component: 'Impostazioni generali del sito (`/admin/settings`), uguali per tutti i siti ma salvate da ognuno nel suo database. '
          + '**Caricamenti**: quante voci per utente e quante immagini per voce (vuoto = nessun limite; admin e rifugi approvati esclusi), '
          + 'immagini in attesa per utente, caricamenti aperti. **Iscrizioni**: aperte o chiuse, quante al giorno dalla stessa rete. '
          + 'Ogni salvataggio va nel Registro con il valore di prima e quello nuovo. '
          + 'Il nome delle voci cambia col sito (personaggi, pet, moto): prova a cambiare sito dalla barra.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const ConLimiti: Story = { name: 'Con limiti', globals: { site: 'furry' } }
export const Predefinite: Story = {
  parameters: { api: { '/api/admin/settings': { ...settings, maxPetsPerUser: null, maxPhotosPerPet: null } } },
}
