import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { userEvent, within } from 'storybook/test'
import AccountMenu from '@core/app/components/organisms/AccountMenu.vue'
import { ADMIN, USER } from '../fixtures'

const open = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(within(canvasElement).getAllByRole('button')[0]!)
}

const meta = {
  title: 'Organismi/AccountMenu',
  component: AccountMenu,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="display:flex;justify-content:flex-end;min-height:640px;padding-right:12px"><story /></div>' })],
  parameters: {
    user: USER,
    api: {
      '/api/me/avatar': { id: null },
      '/api/shelters/me/summary': { status: 'approved', slug: 'rifugio-esempio', name: 'Rifugio Esempio', newRequests: 2 },
      'POST /api/auth/logout': {},
    },
    docs: {
      story: { inline: false, iframeHeight: 680 },
      description: {
        component: 'Menu dell\'account in alto a destra: profilo, area rifugio (solo sui siti con i rifugi), pannello admin, lingua, tema (sistema/chiaro/scuro), '
          + 'accessibilità (meno animazioni, contrasto alto), cookie ed Esci. Chi non ha l\'account ci trova lingua, tema e accesso. '
          + 'Si chiude toccando fuori o con Esc.',
      },
    },
  },
} satisfies Meta<typeof AccountMenu>
export default meta
type Story = StoryObj<typeof meta>

export const Chiuso: Story = {}
export const Aperto: Story = { play: open }
export const Admin: Story = { parameters: { user: ADMIN }, play: open }
export const Visitatore: Story = { parameters: { user: null }, play: open }
