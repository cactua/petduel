import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AppPopover from '@core/app/components/molecules/AppPopover.vue'

const badge = 'display:inline-flex;align-items:center;gap:4px;font:inherit;font-size:12px;font-weight:900;cursor:pointer;padding:4px 11px 4px 8px;border-radius:999px;border:2px solid transparent;background:var(--coral-soft);color:var(--ink)'

const meta = {
  title: 'Molecole/AppPopover',
  component: AppPopover,
  tags: ['autodocs'],
  args: { open: false, placement: 'bottom' },
  argTypes: {
    open: { description: 'Aperto (`v-model:open`)', control: 'boolean' },
    placement: { description: 'Lato del bottone su cui si apre il fumetto', control: 'inline-radio', options: ['bottom', 'top'] },
    label: { description: 'Etichetta accessibile del fumetto' },
    'onUpdate:open': { action: 'update:open' },
  },
  render: args => ({
    components: { AppPopover },
    setup: () => ({ args, badge }),
    template: `
      <div style="padding:70px 24px">
        <AppPopover v-bind="args" v-model:open="args.open">
          <template #trigger="{ toggle, attrs }">
            <button type="button" :style="badge" v-bind="attrs" @click="toggle"><span aria-hidden="true">💗</span> Amato</button>
          </template>
          Almeno 25 cuori ricevuti
        </AppPopover>
      </div>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Fumetto che spiega un elemento al tocco (sui telefoni il `title` non si vede). Lo slot `trigger` riceve `toggle` e gli `attrs` '
          + '(`aria-expanded`, `aria-controls`) da mettere sul bottone; lo slot predefinito è il testo. Si chiude con un secondo tocco, toccando fuori o con Esc '
          + '(il fuoco torna al bottone). Vicino al bordo dello schermo il fumetto si sposta di lato e la freccia resta sul bottone. Usato per i traguardi in PetGallery.',
      },
    },
  },
} satisfies Meta<typeof AppPopover>
export default meta
type Story = StoryObj<typeof meta>

export const Chiuso: Story = {}
export const Aperto: Story = { args: { open: true } }
export const Sopra: Story = { args: { open: true, placement: 'top' } }
export const TestoLungo: Story = {
  args: { open: true },
  render: args => ({
    components: { AppPopover },
    setup: () => ({ args, badge }),
    template: `
      <div style="padding:24px 24px 120px">
        <AppPopover v-bind="args" v-model:open="args.open">
          <template #trigger="{ toggle, attrs }">
            <button type="button" :style="badge" v-bind="attrs" @click="toggle"><span aria-hidden="true">🥇</span> Personaggio della settimana ×3</button>
          </template>
          Il più votato della settimana nei duelli: ogni lunedì si azzera la classifica e si ricomincia
        </AppPopover>
      </div>`,
  }),
}
export const VicinoAlBordo: Story = {
  args: { open: true },
  render: args => ({
    components: { AppPopover },
    setup: () => ({ args, badge }),
    template: `
      <div style="padding:24px 0 120px">
        <AppPopover v-bind="args" v-model:open="args.open">
          <template #trigger="{ toggle, attrs }">
            <button type="button" :style="badge" v-bind="attrs" @click="toggle">💗 Amato</button>
          </template>
          Almeno 25 cuori ricevuti, il fumetto resta dentro lo schermo
        </AppPopover>
      </div>`,
  }),
}
