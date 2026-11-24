import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LegalPage from '@core/app/components/organisms/LegalPage.vue'

const meta = {
  title: 'Organismi/LegalPage',
  component: LegalPage,
  tags: ['autodocs'],
  args: { doc: 'privacy' },
  argTypes: { doc: { control: 'inline-radio', options: ['privacy', 'cookie', 'terms', 'accessibility'], description: 'Quale documento mostrare' } },
  parameters: {
    docs: {
      description: {
        component: 'Privacy, cookie, termini e accessibilità: testi lunghi, uno per lingua in `app/legal/<lingua>.ts` (non nei file di traduzione). '
          + 'Nome del sito, titolare ed email si inseriscono da soli (titolare ed email dal `.env`; finché mancano si vede cosa completare). '
          + 'In fondo i link agli altri documenti.',
      },
    },
  },
} satisfies Meta<typeof LegalPage>
export default meta
type Story = StoryObj<typeof meta>

export const Privacy: Story = {}
export const Cookie: Story = { args: { doc: 'cookie' } }
export const Termini: Story = { args: { doc: 'terms' } }
export const Accessibilita: Story = { args: { doc: 'accessibility' } }
