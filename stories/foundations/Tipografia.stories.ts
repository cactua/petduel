import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h } from 'vue'

const Type = defineComponent({
  setup: () => () => h('div', { style: 'display:grid;gap:20px;max-width:720px' }, [
    h('div', [h('small', { class: 'u-muted' }, 'h1 · Fredoka (--display)'), h('h1', { style: 'margin:4px 0 0' }, 'Chi è il più bello?')]),
    h('div', [h('small', { class: 'u-muted' }, 'h2 · Fredoka'), h('h2', { style: 'margin:4px 0 0' }, 'Classifica della settimana')]),
    h('div', [h('small', { class: 'u-muted' }, 'h3 · Fredoka'), h('h3', { style: 'margin:4px 0 0' }, 'Sfida in corso')]),
    h('div', [h('small', { class: 'u-muted' }, 'Testo · Nunito (--body)'), h('p', { style: 'margin:4px 0 0' }, 'Trascina il tuo preferito sopra l\'altro per votare. Ogni voto è un cuore che resta per sempre.')]),
    h('div', [h('small', { class: 'u-muted' }, '.label / .hint / .error'), h('div', { class: 'field' }, [
      h('span', { class: 'label' }, ['Nome ', h('small', '(facoltativo)')]),
      h('p', { class: 'hint' }, 'Il nome si vede nei duelli e in classifica.'),
      h('p', { class: 'error' }, 'Il nome è troppo corto'),
    ])]),
    h('div', [h('small', { class: 'u-muted' }, '.u-muted'), h('p', { class: 'u-muted', style: 'margin:4px 0 0' }, 'Testo secondario: date, autori, conteggi.')]),
  ]),
})

const meta = {
  title: 'Fondamenta/Tipografia',
  component: Type,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Due famiglie (caricate da Google Fonts come nel `nuxt.config`): **Fredoka** per titoli e numeri grandi (`--display`), '
          + '**Nunito** per il testo (`--body`). Stili di base in `assets/scss/base/_typography.scss`; etichette, aiuti ed errori dei moduli '
          + 'in `atoms/_field.scss`; utility con prefisso `u-` in `atoms/_utilities.scss` (`.u-muted`, `.u-visually-hidden`).',
      },
    },
  },
} satisfies Meta<typeof Type>
export default meta

export const Scala: StoryObj<typeof meta> = {}
