import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ChallengesAdmin from '@core/app/pages/admin/challenges.vue'
import { ADMIN, challengeList } from '../fixtures'
import { TRANSLATED_LOCALES } from '#shared/models'

// Le risposte del server: la lista delle sfide e i campi di una sfida da modificare
const list = challengeList()
const fields = (id: number) => {
  const c = [...list.current, ...list.upcoming].find(x => x.id === id)!
  return {
    title: c.title,
    description: c.description,
    translations: Object.fromEntries(TRANSLATED_LOCALES.map(l => [l, { title: `${c.title} (${l})`, description: c.description }])),
    emoji: c.emoji,
    species: c.species,
    adoptionOnly: c.adoptionOnly,
    startDate: c.startsAt.slice(0, 10),
    started: c.status !== 'upcoming',
  }
}

const meta = {
  title: 'Template/Admin sfide',
  tags: ['autodocs'],
  render: () => ({ components: { ChallengesAdmin }, template: '<ChallengesAdmin />' }),
  parameters: {
    layout: 'padded',
    user: ADMIN,
    api: {
      '/api/challenges': list,
      ...Object.fromEntries([...list.current, ...list.upcoming].map(c => [`GET /api/admin/challenges/${c.id}`, fields(c.id)])),
      ...Object.fromEntries([...list.current, ...list.upcoming].map(c => [`PATCH /api/admin/challenges/${c.id}`, { slug: c.slug }])),
      'POST /api/admin/challenges': { slug: 'nuova-2026-12-07', overlapping: 0 },
    },
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: {
        component: 'Pannello admin `/admin/challenges`: sfide in corso e programmate, ognuna con **Modifica** (ed **Elimina** se non ha partecipanti). '
          + '"Modifica" riempie lo stesso modulo della nuova sfida: titolo, descrizione, traduzioni ed emoji si cambiano sempre, '
          + 'la data solo finché la sfida non è iniziata, specie e "solo rifugi" solo finché nessuno partecipa. L\'indirizzo della sfida non cambia.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Elenco: Story = {}
