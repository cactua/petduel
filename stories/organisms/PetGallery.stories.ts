import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PetGallery from '@core/app/components/organisms/PetGallery.vue'
import { gallery, USER } from '../fixtures'

const meta = {
  title: 'Organismi/PetGallery',
  component: PetGallery,
  tags: ['autodocs'],
  args: { pet: gallery(0), editable: false, linkTitle: false, hero: false },
  argTypes: {
    pet: { description: 'Partecipante con foto, traguardi e trofei (PetGallery)' },
    editable: { description: 'È tuo: "Gestisci" mostra stato delle foto, scelta di quelle nei duelli, modifica dei dati ed eliminazione; in più i cuori e il prossimo traguardo' },
    linkTitle: { description: 'Il nome porta alla pagina del partecipante (nelle liste del profilo)' },
    hero: { description: 'In cima alla pagina del partecipante: copertina grande e titolo h1' },
    onChanged: { action: 'changed' },
    onDeleted: { action: 'deleted' },
  },
  decorators: [() => ({ template: '<div style="max-width:760px"><story /></div>' })],
  parameters: {
    user: USER,
    api: { 'PATCH /api/photos/*': {}, 'DELETE /api/photos/*': {}, 'PATCH /api/pets/*': {}, 'DELETE /api/pets/*': {} },
    docs: {
      description: {
        component: 'Scheda di un partecipante: copertina (l\'ultima foto pubblica), riquadri delle altre foto con "Mostra tutte", traguardi e trofei delle sfide. '
          + 'Toccando una foto si apre il visore. Al proprietario "Gestisci" mostra lo stato di ogni foto (in revisione, rifiutata con il motivo), '
          + 'gli interruttori per i duelli, la correzione dei dati (razza e città solo dove il sito le usa) e l\'eliminazione. Lo slot aggiunge contenuto sotto il titolo.',
      },
    },
  },
} satisfies Meta<typeof PetGallery>
export default meta
type Story = StoryObj<typeof meta>

export const Pubblica: Story = {}
export const PaginaDelPartecipante: Story = { args: { hero: true } }
export const NelProfilo: Story = { args: { linkTitle: true } }
export const Proprietario: Story = { args: { pet: gallery(0, { owner: true }), editable: true } }
// Impostazioni admin → limite di immagini raggiunto: al posto di "Aggiungi" si dice perché
export const LimiteImmagini: Story = {
  name: 'Proprietario, limite di immagini raggiunto',
  args: { pet: gallery(0, { owner: true }), editable: true },
  parameters: { api: { '/api/limits': { maxPetsPerUser: null, maxPhotosPerPet: 2, uploadsOpen: true, signupsOpen: true, exempt: false } } },
}
