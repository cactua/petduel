import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h, onMounted, ref } from 'vue'

// Le variabili CSS generate da $theme-light/$theme-dark (abstracts/_tokens.scss) e ridefinite dai siti
const GROUPS: { title: string, note: string, vars: string[] }[] = [
  { title: 'Superfici e testo', note: 'Sfondo della pagina, schede, testo principale e secondario, linee', vars: ['bg', 'surface', 'ink', 'muted', 'line'] },
  { title: 'Azione', note: 'Accento del sito. --action è il colore dei pulsanti con testo bianco (contrasto almeno 4.5:1)', vars: ['coral', 'coral-deep', 'coral-soft', 'action', 'glow'] },
  { title: 'Premi, cuori, conferme', note: 'Giallo medaglietta per premi e sfide, rosa per i voti, verde per le conferme', vars: ['sun', 'sun-deep', 'sun-ink', 'heart', 'heart-soft', 'mint'] },
  { title: 'Sfondo a macchie', note: 'Le tre macchie sfumate dietro la pagina', vars: ['blob-1', 'blob-2', 'blob-3'] },
  { title: 'Categorie (PetDuel)', note: 'Tinte delle categorie degli animali: chip e cornici', vars: ['t-cane', 't-gatto', 't-coniglio', 't-roditore', 't-uccello', 't-rettile', 't-altro'] },
]

const Palette = defineComponent({
  setup() {
    const values = ref<Record<string, string>>({})
    onMounted(() => {
      const css = getComputedStyle(document.documentElement)
      values.value = Object.fromEntries(GROUPS.flatMap(g => g.vars).map(v => [v, css.getPropertyValue(`--${v}`).trim()]))
    })
    return () => h('div', { style: 'display:grid;gap:28px' }, GROUPS.map(g => h('section', [
      h('h3', { style: 'margin:0 0 4px' }, g.title),
      h('p', { class: 'hint', style: 'margin:0 0 12px' }, g.note),
      h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px' }, g.vars.map(v => h('div', { class: 'card card--compact', style: 'display:grid;gap:8px' }, [
        h('span', { style: `display:block;height:56px;border-radius:12px;background:var(--${v});border:1px solid var(--line)` }),
        h('code', { style: 'font-size:13px;font-weight:800' }, `--${v}`),
        h('small', { class: 'u-muted' }, values.value[v] || '—'),
      ]))),
    ])))
  },
})

const meta = {
  title: 'Fondamenta/Colori',
  component: Palette,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Variabili CSS dei colori. Il nucleo le genera dai token Sass `$theme-light` e `$theme-dark`',
          '(`layers/core/app/assets/scss/abstracts/_tokens.scss`); ogni sito può ridefinirle nel proprio',
          '`sites/<sito>/app/assets/theme.scss` (FurDuel: arancio bruciato e crema; BikeDuel: arancio carburatore e antracite).',
          'Nei componenti si usano sempre le variabili (`var(--coral)`), mai i valori: così cambiano con sito e tema.',
          '\n\nCambia **Sito** e **Tema** dalla barra per vedere le palette.',
        ].join(' '),
      },
    },
  },
} satisfies Meta<typeof Palette>
export default meta

export const Palette_: StoryObj<typeof meta> = { name: 'Palette' }
