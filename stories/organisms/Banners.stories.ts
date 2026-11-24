import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ConsentBanner from '@core/app/components/organisms/ConsentBanner.vue'
import RulesPrompt from '@core/app/components/organisms/RulesPrompt.vue'
import { USER } from '../fixtures'

const meta = {
  title: 'Organismi/ConsentBanner e RulesPrompt',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 420 },
      description: {
        component: 'Due richieste che compaiono in basso, sopra la pagina.\n\n'
          + '- **ConsentBanner**: consenso ai cookie degli annunci Google. Rifiuta e Accetta hanno lo stesso peso; la scelta resta 6 mesi (cookie `consenso`) '
          + 'e si riapre dal menu dell\'account, dove dice anche cosa si è scelto.\n'
          + '- **RulesPrompt**: chi si era iscritto prima delle regole le trova qui una volta (`user.needsRules`). Non copre la richiesta dei cookie né la pagina delle regole.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Consenso: Story = {
  name: 'ConsentBanner',
  render: () => ({ components: { ConsentBanner }, template: '<div style="min-height:380px"><ConsentBanner /></div>' }),
}
export const ConsensoRiaperto: Story = {
  name: 'ConsentBanner (riaperto dopo aver accettato)',
  parameters: { state: { 'cookie:consenso': 'ads', 'consent-open': true } },
  render: () => ({ components: { ConsentBanner }, template: '<div style="min-height:380px"><ConsentBanner /></div>' }),
}
export const Regole: Story = {
  name: 'RulesPrompt',
  parameters: { user: { ...USER, needsRules: true }, state: { 'cookie:consenso': 'none' }, api: { 'POST /api/me/rules': {} } },
  render: () => ({ components: { RulesPrompt }, template: '<div style="min-height:380px"><RulesPrompt /></div>' }),
}
