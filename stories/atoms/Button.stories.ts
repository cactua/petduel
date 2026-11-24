import type { Meta, StoryObj } from '@storybook/vue3-vite'

interface ButtonArgs { label: string, variant: 'primary' | 'ghost' | 'ok' | 'danger' | 'link' | '', size: '' | 'sm' | 'lg', block: boolean, disabled: boolean }

const classes = (a: ButtonArgs) => ['btn', a.variant && `btn--${a.variant}`, a.size && `btn--${a.size}`, a.block && 'btn--block'].filter(Boolean).join(' ')

const meta = {
  title: 'Atomi/Button (.btn)',
  tags: ['autodocs'],
  render: args => ({ setup: () => ({ args, cls: classes(args) }), template: '<button type="button" :class="cls" :disabled="args.disabled">{{ args.label }}</button>' }),
  args: { label: 'Vota', variant: 'primary', size: '', block: false, disabled: false },
  argTypes: {
    label: { description: 'Testo del bottone' },
    variant: { control: 'select', options: ['primary', 'ghost', 'ok', 'danger', 'link', ''], description: '`btn--primary` azione principale (colore --action, alone), `btn--ghost` secondaria, `btn--ok` conferma, `btn--danger` distruttiva, `btn--link` come un link' },
    size: { control: 'inline-radio', options: ['', 'sm', 'lg'], description: '`btn--sm` / `btn--lg`' },
    block: { description: '`btn--block`: larghezza piena' },
    disabled: { description: 'Attributo disabled: opacità ridotta, niente cursore' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Atomo CSS (`assets/scss/atoms/_button.scss`): vale per `<button>` e per i link che sembrano bottoni (`<NuxtLink class="btn btn--ghost">`). '
          + 'Forma a pillola, testo in grassetto. Il principale si "schiaccia" al tocco (senza animazione con *riduci movimento*).',
      },
    },
  },
} satisfies Meta<ButtonArgs>
export default meta
type Story = StoryObj<typeof meta>

export const Principale: Story = {}
export const Secondario: Story = { args: { variant: 'ghost', label: 'Annulla' } }
export const Conferma: Story = { args: { variant: 'ok', label: 'Approva' } }
export const Distruttivo: Story = { args: { variant: 'danger', label: 'Elimina' } }
export const ComeLink: Story = { args: { variant: 'link', label: 'Mostra tutte' } }
export const Disabilitato: Story = { args: { disabled: true, label: 'Invio…' } }

export const Tutti: Story = {
  render: () => ({
    template: `<div style="display:grid;gap:16px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn btn--primary btn--sm">Piccolo</button><button class="btn btn--primary">Normale</button><button class="btn btn--primary btn--lg">Grande</button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn btn--primary">Principale</button><button class="btn btn--ghost">Secondario</button><button class="btn btn--ok">Conferma</button>
        <button class="btn btn--danger">Distruttivo</button><button class="btn btn--link">Link</button><button class="btn btn--primary" disabled>Disabilitato</button>
      </div>
      <button class="btn btn--primary btn--block btn--lg">A tutta larghezza</button>
    </div>`,
  }),
}
