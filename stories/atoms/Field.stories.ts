import type { Meta, StoryObj } from '@storybook/vue3-vite'

interface FieldArgs { label: string, optional: boolean, placeholder: string, hint: string, error: string, multiline: boolean }

const meta = {
  title: 'Atomi/Field (.field, .label, .input)',
  tags: ['autodocs'],
  render: args => ({
    setup: () => ({ args }),
    template: `<div class="field" style="max-width:420px">
      <label for="f" class="label">{{ args.label }} <small v-if="args.optional">(facoltativo)</small></label>
      <textarea v-if="args.multiline" id="f" class="input" rows="3" :placeholder="args.placeholder" />
      <input v-else id="f" class="input" :placeholder="args.placeholder" :aria-invalid="!!args.error">
      <p v-if="args.hint" class="hint">{{ args.hint }}</p>
      <p v-if="args.error" class="error" role="alert">{{ args.error }}</p>
    </div>`,
  }),
  args: { label: 'Nome', optional: false, placeholder: 'Come si chiama?', hint: 'Si vede nei duelli e in classifica.', error: '', multiline: false },
  argTypes: {
    label: { description: '`.label`: etichetta in grassetto; il `<small>` dentro resta leggero (per "facoltativo")' },
    optional: { description: 'Aggiunge "(facoltativo)" nell\'etichetta' },
    placeholder: { description: 'Testo d\'esempio nel campo' },
    hint: { description: '`.hint`: aiuto sotto il campo' },
    error: { description: '`.error`: messaggio d\'errore (con role="alert")' },
    multiline: { description: '`<textarea class="input">`: si allunga solo in verticale' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Atomi dei moduli (`atoms/_field.scss`): **`.field`** impila etichetta, campo, aiuto ed errore; **`.input`** vale per `input`, `select` e `textarea`. '
          + 'I moduli dell\'admin aggiungono le molecole di `molecules/_admin-form.scss`.',
      },
    },
  },
} satisfies Meta<FieldArgs>
export default meta
type Story = StoryObj<typeof meta>

export const Campo: Story = {}
export const Facoltativo: Story = { args: { label: 'Città', optional: true, placeholder: 'Es. Torino', hint: '' } }
export const ConErrore: Story = { args: { error: 'Il nome è troppo corto' } }
export const AreaDiTesto: Story = { args: { label: 'Descrizione', multiline: true, placeholder: 'Racconta qualcosa…', hint: 'Massimo 300 caratteri.' } }
export const Selezione: Story = {
  render: () => ({
    template: `<div class="field" style="max-width:420px"><label for="s" class="label">Stato</label>
      <select id="s" class="input"><option>Cerca casa</option><option>In affido</option><option>Adottato!</option></select></div>`,
  }),
}
