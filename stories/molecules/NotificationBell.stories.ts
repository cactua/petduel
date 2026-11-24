import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { userEvent, within } from 'storybook/test'
import NotificationBell from '@core/app/components/molecules/NotificationBell.vue'
import { notifications, USER } from '../fixtures'

const meta = {
  title: 'Molecole/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="display:flex;justify-content:flex-end;min-height:380px;padding-right:12px"><story /></div>' })],
  parameters: {
    user: USER,
    api: { '/api/notifications': notifications(), 'POST /api/notifications/read': {} },
    docs: {
      description: {
        component: 'Campanella degli avvisi nella testata: il pallino conta quelli non letti (oltre 9 mostra "9+"). Aprirla segna tutto come letto; '
          + 'il pannello si chiude toccando fuori, con Esc o cambiando pagina. In fondo propone le notifiche push (`PushToggle compact`).',
      },
    },
  },
} satisfies Meta<typeof NotificationBell>
export default meta
type Story = StoryObj<typeof meta>

export const NonLetti: Story = { name: 'Con avvisi non letti' }
export const Aperta: Story = {
  play: async ({ canvasElement }) => {
    const bell = await within(canvasElement).findByRole('button', {}, { timeout: 3000 })
    await new Promise(r => setTimeout(r, 400))
    await userEvent.click(bell)
  },
}
export const Vuota: Story = {
  parameters: { api: { '/api/notifications': { items: [], unread: 0 } } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button'))
  },
}
