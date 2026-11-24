import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { reactive } from 'vue'
import AdAudienceFields from '@core/app/components/molecules/AdAudienceFields.vue'
import AdDealFields from '@core/app/components/molecules/AdDealFields.vue'
import AdScheduleFields from '@core/app/components/molecules/AdScheduleFields.vue'
import { AD_DEAL_DEFAULT, AD_TARGETING_DEFAULT } from '#shared/models'
import { deal, targeting } from '../fixtures'

// Nell'admin questi campi stanno dentro <fieldset class="admin-form admin-form--tight"> (molecola CSS admin-form)
const box = (legend: string, inner: string) => `<fieldset class="admin-form admin-form--tight card" style="max-width:620px;border:0">
  <legend style="font-weight:900;font-family:var(--display);font-size:18px;padding:0">${legend}</legend>${inner}
  <details class="hint"><summary>Valore (v-model)</summary><pre style="white-space:pre-wrap">{{ value }}</pre></details>
</fieldset>`

const meta = {
  title: 'Molecole/Campi delle campagne (admin)',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Gruppi di campi del modulo delle campagne pubblicitarie (`/admin/ads`), tutti con `v-model`. Nella pagina stanno dentro un '
          + '`<fieldset class="admin-form admin-form--tight">`: lo stile dei campi viene dalla molecola CSS `assets/scss/molecules/_admin-form.scss`.\n\n'
          + '- **AdScheduleFields**: giorni della settimana e fascia oraria (vuoto = sempre).\n'
          + '- **AdAudienceFields**: paesi, zone attorno a una città (ricerca OpenStreetMap solo col pulsante, come chiedono le loro regole), lingue, categorie, utenti o ospiti.\n'
          + '- **AdDealFields**: referente, prezzo (a corpo, CPM, CPC) e tetti; non compare mai nell\'annuncio.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Orari: Story = {
  name: 'AdScheduleFields',
  render: () => ({ components: { AdScheduleFields }, setup: () => ({ value: reactive(targeting()) }), template: box('4 · Quando', '<AdScheduleFields v-model="value" />') }),
}
export const OrariVuoti: Story = {
  name: 'AdScheduleFields (sempre)',
  render: () => ({ components: { AdScheduleFields }, setup: () => ({ value: reactive({ ...AD_TARGETING_DEFAULT }) }), template: box('4 · Quando', '<AdScheduleFields v-model="value" />') }),
}
export const Pubblico: Story = {
  name: 'AdAudienceFields',
  render: () => ({ components: { AdAudienceFields }, setup: () => ({ value: reactive(targeting()) }), template: box('5 · Chi la vede', '<AdAudienceFields v-model="value" />') }),
}
export const PubblicoVuoto: Story = {
  name: 'AdAudienceFields (tutti)',
  render: () => ({ components: { AdAudienceFields }, setup: () => ({ value: reactive({ ...AD_TARGETING_DEFAULT }) }), template: box('5 · Chi la vede', '<AdAudienceFields v-model="value" />') }),
}
export const Accordo: Story = {
  name: 'AdDealFields',
  render: () => ({ components: { AdDealFields }, setup: () => ({ value: reactive(deal()) }), template: box('6 · Accordo e budget', '<AdDealFields v-model="value" />') }),
}
export const AccordoVuoto: Story = {
  name: 'AdDealFields (nessun prezzo)',
  render: () => ({ components: { AdDealFields }, setup: () => ({ value: reactive({ ...AD_DEAL_DEFAULT }) }), template: box('6 · Accordo e budget', '<AdDealFields v-model="value" />') }),
}
