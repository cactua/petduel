import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { MyShelter, PetAdoption } from '#shared/models'
import { gallery, USER } from '../fixtures'

// Componenti del layer shelters: esistono solo su PetDuel e si usano per nome (registrati come in Nuxt).
// Sugli altri siti AdoptionCard è il segnaposto vuoto del nucleo
const adoption = (status: PetAdoption['status']): PetAdoption => ({
  status,
  age: '2 anni',
  about: 'Dolcissima e curiosa, va d\'accordo con altri cani. Cerca una famiglia con un giardino o tante passeggiate.',
  sex: 'f',
  size: 'media',
  neutered: true,
  hideFromRankings: false,
  shelter: { slug: 'rifugio-esempio', name: 'Rifugio Esempio', city: 'Torino' },
} as PetAdoption)

const pet = (status: PetAdoption['status'] | null) => ({ ...gallery(0), adoption: status, adoptionInfo: status ? adoption(status) : null })

const shelter: NonNullable<MyShelter['shelter']> = {
  slug: 'rifugio-esempio', name: 'Rifugio Esempio', city: 'Torino', status: 'approved', rejectReason: null, taxCode: '97000000000',
  description: 'Da vent\'anni ci prendiamo cura di cani e gatti abbandonati, con l\'aiuto di tanti volontari.',
  tagline: 'Ogni zampa merita una casa', website: 'https://example.org', accent: 'mint', logo: null, banner: null, available: 12, adopted: 340,
  help: 'Cerchiamo volontari per le passeggiate del weekend e famiglie per lo stallo.',
  needs: ['Coperte', 'Crocchette per cuccioli', 'Volontari nel weekend'],
  address: 'Via Esempio 1, Torino', lat: 45.0703, lng: 7.6869, hours: 'Sabato e domenica 10–17',
  publicEmail: 'info@example.org', publicPhone: '', socials: { instagram: 'https://instagram.com/esempio' }, donateUrl: '', iban: '',
  contactEmail: 'privato@example.org', phone: '',
} as unknown as NonNullable<MyShelter['shelter']>

const meta = {
  title: 'Organismi/Rifugi (PetDuel)',
  tags: ['autodocs'],
  globals: { site: 'pets' },
  parameters: {
    user: USER,
    api: { 'POST /api/pets/*': {}, 'PUT /api/pets/*': {}, 'PATCH /api/shelters/me': {}, '/api/geocode': [{ label: 'Via Roma 1, Torino', lat: 45.07, lng: 7.68 }] },
    docs: {
      description: {
        component: 'Organismi del layer `layers/shelters`, incluso solo da **PetDuel**.\n\n'
          + '- **AdoptionCard**: scheda di adozione sulla pagina del pet. Il pubblico vede stato (cerca casa, in affido, adottato), dati e descrizione, e può scrivere '
          + 'al rifugio dopo l\'accesso; il rifugio proprietario (verificato) la compila e cambia lo stato. Sui siti senza rifugi al suo posto c\'è il segnaposto '
          + 'vuoto del nucleo (`organisms/AdoptionCard.vue`).\n'
          + '- **ShelterEditor**: modifica della pagina pubblica del rifugio (`/my-shelter`): presentazione, banner e logo, colore, bisogni, indirizzo con ricerca '
          + 'o tocco sulla mappa, orari, contatti, social e donazioni.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const card = (p: ReturnType<typeof pet>, manage = false) => ({ setup: () => ({ p, manage }), template: '<div style="max-width:560px"><AdoptionCard :pet="p" :manage="manage" /></div>' })

export const CercaCasa: Story = { name: 'AdoptionCard (cerca casa)', render: () => card(pet('available')) }
export const CercaCasaVisitatore: Story = { name: 'AdoptionCard (senza accesso)', parameters: { user: null }, render: () => card(pet('available')) }
export const InAffido: Story = { name: 'AdoptionCard (in affido)', render: () => card(pet('fostered')) }
export const Adottato: Story = { name: 'AdoptionCard (adottato)', render: () => card(pet('adopted')) }
export const Rifugio: Story = { name: 'AdoptionCard (vista del rifugio)', render: () => card(pet('available'), true) }
export const RifugioSenzaScheda: Story = { name: 'AdoptionCard (rifugio, da compilare)', render: () => card(pet(null), true) }
export const Editor: Story = {
  name: 'ShelterEditor',
  render: () => ({ setup: () => ({ shelter }), template: '<div class="card" style="max-width:760px"><ShelterEditor :shelter="shelter" /></div>' }),
}
