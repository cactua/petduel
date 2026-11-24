import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MyAvatar from '@core/app/components/atoms/MyAvatar.vue'
import { USER } from '../fixtures'

const meta = {
  title: 'Atomi/MyAvatar',
  component: MyAvatar,
  tags: ['autodocs'],
  args: { letter: 'G' },
  argTypes: { letter: { description: 'Lettera mostrata quando non c\'è un avatar (di solito l\'iniziale del nome)' } },
  // Il cerchio lo disegna il genitore (menu dell'account, barra in basso)
  render: args => ({
    components: { MyAvatar },
    setup: () => ({ args }),
    template: `<span style="display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--coral-soft);color:var(--coral-deep);font-weight:900;font-family:var(--display);font-size:20px">
      <MyAvatar :letter="args.letter" />
    </span>`,
  }),
  parameters: {
    user: USER,
    api: { '/api/me/avatar': { id: null } },
    docs: {
      description: {
        component: 'Il proprio avatar dentro un cerchio già disegnato dal genitore (menu dell\'account, barra in basso). Lo legge da `/api/me/avatar` '
          + 'con `useMyAvatar()`; senza avatar, o senza accesso, mostra la lettera.',
      },
    },
  },
} satisfies Meta<typeof MyAvatar>
export default meta
type Story = StoryObj<typeof meta>

export const SenzaAvatar: Story = {}
export const Visitatore: Story = { parameters: { user: null } }
