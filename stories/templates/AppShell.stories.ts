import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DefaultLayout from '@core/app/layouts/default.vue'
import { challengeList, duelPair, notifications, ranked, USER } from '../fixtures'

const meta = {
  title: 'Template/AppShell (layout)',
  component: DefaultLayout,
  tags: ['autodocs'],
  // Come in Nuxt: la pagina sta dentro #__nuxt, che occupa almeno tutta l'altezza (base/_reset.scss)
  decorators: [() => ({ template: '<div id="__nuxt"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    user: USER,
    state: { 'cookie:consenso': 'none' },
    api: { '/api/notifications': notifications(), '/api/me/avatar': { id: null }, '/api/challenges': challengeList() },
    docs: {
      story: { inline: false, iframeHeight: 760 },
      description: {
        component: 'Il template di tutte le pagine (`layouts/default.vue`, blocco `app-shell`): link "salta al contenuto", testata con logo (`SiteIcon` + nome del sito), '
          + 'sezioni (Sfide, Classifica, Adotta solo sui siti con i rifugi), Carica o Accedi, campanella e menu dell\'account; contenuto della pagina nello slot; '
          + 'note legali in fondo; su telefono la barra in basso (dock) con il pulsante grande per caricare. Una pagina può aggiungere qualcosa nella testata '
          + 'con `<Teleport to="#header-extra">`. Cambia sito, lingua e tema dalla barra; prova anche la vista telefono.',
      },
    },
  },
} satisfies Meta<typeof DefaultLayout>
export default meta
type Story = StoryObj<typeof meta>

export const ConDuello: Story = {
  name: 'Home (duello)',
  render: () => ({
    components: { DefaultLayout },
    setup: () => ({ duel: { pets: duelPair(), token: 'demo' } }),
    template: `<DefaultLayout>
      <!-- Come pages/index.vue: con .u-fit-screen il layout sta in uno schermo (niente piè di pagina) -->
      <section class="u-fit-screen" style="flex:1;display:flex;flex-direction:column;gap:10px"><ChallengeBanner /><DuelPanel :duel="duel" :failed="false" :votes="0" hint="" toast="" /></section>
    </DefaultLayout>`,
  }),
}
export const ConClassifica: Story = {
  name: 'Pagina con contenuto',
  render: () => ({
    components: { DefaultLayout },
    setup: () => ({ list: ranked(5) }),
    template: `<DefaultLayout>
      <section style="display:grid;gap:10px;max-width:640px;width:100%;margin:0 auto">
        <h1 style="margin:0">Classifica</h1>
        <PetRankRow v-for="p in list" :key="p.id" :pet="p" :score="'❤ ' + p.score" :detail="p.city || p.breed" />
      </section>
    </DefaultLayout>`,
  }),
}
export const Visitatore: Story = {
  parameters: { user: null, state: {} },
  render: () => ({ components: { DefaultLayout }, template: '<DefaultLayout><section class="card" style="max-width:640px;margin:0 auto"><AuthForm mode="login" /></section></DefaultLayout>' }),
}
export const Telefono: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: ConClassifica.render,
}
