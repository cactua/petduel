import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AdminLog from '@core/app/pages/admin/log.vue'
import { ADMIN } from '../fixtures'

// Azioni di esempio, come le salva il server: metodo e percorso, più i campi inviati
const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
const rows = [
  ['POST reports', '{"action":"dismiss","target":"user","id":166}', 5],
  ['POST photos/412', '{"action":"approve"}', 12],
  ['POST photos/409', '{"action":"reject","reason":"L\'immagine è sfocata"}', 14],
  ['PATCH challenges/8', '{"title":"Il più dormiglione","emoji":"😴"}', 60],
  ['PATCH ads/3', '{"active":false}', 90],
  ['PATCH users/21', '{"banned":true}', 26 * 60],
  ['POST challenges', '{"title":"Linguaccia!","startDate":"2026-12-07"}', 27 * 60],
  ['POST ads', '', 28 * 60],
  ['PUT ad-settings', '{"every":3,"startAfter":0}', 4 * 24 * 60],
] as const
const log = rows.map(([action, detail, m], i) => ({ id: 100 - i, admin: i % 3 ? 'cactua' : 'admin', action, target: action.match(/\/(\d+)/)?.[1] ?? '', detail, at: at(m) }))

const meta = {
  title: 'Template/Admin registro',
  tags: ['autodocs'],
  render: () => ({ components: { AdminLog }, template: '<AdminLog />' }),
  parameters: {
    layout: 'padded',
    user: ADMIN,
    api: { '/api/admin/log': log },
    docs: {
      story: { inline: false, iframeHeight: 820 },
      description: {
        component: 'Registro delle azioni admin (`/admin/log`): ogni azione è una frase ("Ha approvato la foto #412") con icona verde, rossa o neutra, '
          + 'chi l\'ha fatta, l\'ora e la categoria. Raggruppate per giorno, filtrabili per categoria; i campi inviati restano in "Dati inviati". '
          + 'Le frasi le scrive `shared/adminLog.ts`, che vale anche per le righe salvate prima.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Elenco: Story = {}
export const Vuoto: Story = { parameters: { api: { '/api/admin/log': [] } } }
