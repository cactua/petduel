import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { entries } from '../fixtures'

const meta = {
  title: 'Template/AdminPage (.admin-page)',
  tags: ['autodocs'],
  render: () => ({
    setup: () => ({ list: entries(4) }),
    template: `<section class="admin-page">
      <header class="admin-page__header">
        <h1 class="admin-page__title">Foto da approvare</h1>
        <button class="btn btn--ghost btn--sm">Aggiorna</button>
      </header>
      <p class="admin-page__lead">Controlla che ogni immagine rispetti le regole: soggetto ben visibile, niente persone riconoscibili, niente contenuti di altri.</p>
      <p class="admin-page__notice">✓ 3 foto approvate</p>
      <h2 class="admin-page__heading">In attesa</h2>
      <div class="admin-page__list">
        <article v-for="p in list" :key="p.id" class="admin-page__item">
          <img :src="p.image" :alt="p.name" style="width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px">
          <b>{{ p.name }}</b><small class="u-muted">@{{ p.owner }}</small>
          <div class="admin-page__actions"><button class="btn btn--ok btn--sm">Approva</button><button class="btn btn--danger btn--sm">Rifiuta</button></div>
        </article>
      </div>
      <p class="admin-page__empty">Nessuna segnalazione aperta. 🎉</p>
    </section>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Template CSS condiviso dalle pagine del pannello admin (`assets/scss/templates/_admin-page.scss`): intestazione con titolo e azioni, '
          + 'testo introduttivo (`__lead`), titoli di sezione (`__heading`), griglia di schede da rivedere (`__list` / `__item` / `__actions`), '
          + 'messaggio di lista vuota (`__empty`) e di conferma (`__notice`). Ogni pagina aggiunge il proprio blocco BEM (es. `report-review`).',
      },
    },
  },
} satisfies Meta
export default meta

export const Struttura: StoryObj<typeof meta> = {}
