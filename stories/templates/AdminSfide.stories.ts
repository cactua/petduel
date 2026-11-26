import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ChallengesList from '@core/app/pages/admin/challenges/index.vue'
import ChallengeNew from '@core/app/pages/admin/challenges/new.vue'
import ChallengeEdit from '@core/app/pages/admin/challenges/[id].vue'
import { ADMIN, challengeList } from '../fixtures'
import { TRANSLATED_LOCALES, type AdminChallenge, type AdminChallengeDetail } from '#shared/models'

// Le sfide del pannello: quelle delle fixture, più una automatica fra tre settimane senza traduzioni
const base = challengeList()
const DAY = 86_400_000
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString()
const items: AdminChallenge[] = [
  { ...base.upcoming[0]!, id: 4, slug: 'zampe-2026', title: 'Zampe al sole', emoji: '☀️', startsAt: inDays(18), endsAt: inDays(25), automatic: true, translated: [] },
  { ...base.upcoming[0]!, automatic: false, translated: ['en', 'de'] },
  { ...base.current[0]!, automatic: true, translated: [...TRANSLATED_LOCALES] },
  { ...base.past[0]!, automatic: false, translated: [...TRANSLATED_LOCALES] },
]
const detail = (c: AdminChallenge): AdminChallengeDetail => ({
  id: c.id,
  slug: c.slug,
  status: c.status,
  entries: c.entries,
  automatic: c.automatic,
  fields: {
    title: c.title,
    description: c.description,
    emoji: c.emoji,
    species: c.species,
    adoptionOnly: c.adoptionOnly,
    startDate: c.startsAt.slice(0, 10),
    translations: Object.fromEntries(TRANSLATED_LOCALES.map(l => [l, c.translated.includes(l) ? { title: `${c.title} (${l})`, description: c.description } : { title: '', description: '' }])),
  },
})

const api = {
  '/api/admin/challenges': { items, hasThemes: true },
  'POST /api/admin/challenges': { slug: 'nuova-2026-12-07', overlapping: 0 },
  ...Object.fromEntries(items.flatMap(c => [
    [`GET /api/admin/challenges/${c.id}`, detail(c)],
    [`PATCH /api/admin/challenges/${c.id}`, { slug: c.slug }],
    [`DELETE /api/admin/challenges/${c.id}`, { ok: true }],
  ])),
}

const meta = {
  title: 'Template/Admin sfide',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    user: ADMIN,
    route: '/admin/challenges',
    api,
    docs: {
      story: { inline: false, iframeHeight: 1100 },
      description: {
        component: 'Sezione sfide del pannello admin. **Elenco** (`/admin/challenges`): calendario delle prossime 8 settimane (le libere si programmano con un tocco), '
          + 'poi le sfide per stato (in corso, programmate, concluse) con ricerca, traduzioni mancanti, partecipanti e azioni. '
          + '**Nuova** (`/admin/challenges/new`, anche `?start=` dal calendario) e **Modifica** (`/admin/challenges/<id>`) usano `ChallengeForm`: '
          + 'tema con emoji suggerite, traduzioni a schede con lo stato di ogni lingua, date rapide con l\'intervallo esatto e l\'avviso delle sovrapposizioni, '
          + 'anteprima dal vivo e avviso se si esce senza salvare. Una sfida iniziata non cambia data; con partecipanti non cambia pubblico.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Elenco: Story = { render: () => ({ components: { ChallengesList }, template: '<ChallengesList />' }) }
export const NuovaSfida: Story = {
  name: 'Nuova sfida',
  parameters: { route: '/admin/challenges/new' },
  render: () => ({ components: { ChallengeNew }, template: '<ChallengeNew />' }),
}
export const ModificaProgrammata: Story = {
  name: 'Modifica (programmata)',
  parameters: { route: `/admin/challenges/${items[1]!.id}` },
  render: () => ({ components: { ChallengeEdit }, template: '<ChallengeEdit />' }),
}
export const ModificaInCorso: Story = {
  name: 'Modifica (in corso, con partecipanti)',
  parameters: { route: `/admin/challenges/${items[2]!.id}` },
  render: () => ({ components: { ChallengeEdit }, template: '<ChallengeEdit />' }),
}
export const Telefono: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => ({ components: { ChallengesList }, template: '<ChallengesList />' }),
}
