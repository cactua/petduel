<script setup lang="ts">
import type { AdminOverview } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Admin' })

const { data, refresh, error } = await useFetch<AdminOverview>('/api/admin/overview')
// Segnalazioni aperte: dal conteggio del menu admin (pages/admin.vue)
const todo = useNuxtData<{ reports: number }>('admin-todo').data
const reports = computed(() => todo.value?.reports ?? 0)

// Si aggiorna da sola ogni 20 secondi finché la scheda è visibile
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') refresh()
  }, 20_000)
})
onBeforeUnmount(() => clearInterval(timer))

const fmt = (n: number) => n.toLocaleString('it-IT')
const pct = (n: number) => `${Math.round(n * 100)}%`
// Un clic può arrivare senza visualizzazione (link aperto a mano): il rapporto si ferma al 100%
const ctr = computed(() => (data.value?.today.adViews ? Math.min(1, data.value.today.adClicks / data.value.today.adViews) : 0))
const series = (key: 'votes' | 'signups' | 'uploads') => (data.value?.days ?? []).map(d => ({ day: d.day, value: d[key] }))
</script>

<template>
  <section class="admin-page dashboard">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Panoramica</h1>
      <span v-if="data" class="dashboard__live"><i class="dashboard__pulse" aria-hidden="true" />{{ data.now.onlineVoters }} {{ data.now.onlineVoters === 1 ? 'persona sta' : 'persone stanno' }} votando</span>
    </header>
    <p v-if="error" class="error" role="alert">Non riesco a caricare i dati</p>

    <template v-if="data">
      <!-- Prima le cose che aspettano qualcuno: se non c'è niente, lo si dice -->
      <div class="dashboard__todo">
        <NuxtLink v-if="data.todo.photos" to="/admin/foto" class="dashboard__task">
          <b class="dashboard__task-count">{{ data.todo.photos }}</b> foto da approvare <span class="dashboard__arrow">→</span>
        </NuxtLink>
        <NuxtLink v-if="data.todo.shelters" to="/admin/rifugi" class="dashboard__task">
          <b class="dashboard__task-count">{{ data.todo.shelters }}</b> {{ data.todo.shelters === 1 ? 'rifugio da verificare' : 'rifugi da verificare' }} <span class="dashboard__arrow">→</span>
        </NuxtLink>
        <NuxtLink v-if="reports" to="/admin/segnalazioni" class="dashboard__task">
          <b class="dashboard__task-count">{{ reports }}</b> {{ reports === 1 ? 'segnalazione da guardare' : 'segnalazioni da guardare' }} <span class="dashboard__arrow">→</span>
        </NuxtLink>
        <p v-if="!data.todo.photos && !data.todo.shelters && !reports" class="dashboard__done">✅ Niente in attesa: tutto in ordine</p>
      </div>

      <h2 class="admin-page__heading">Oggi</h2>
      <div class="dashboard__tiles">
        <div class="dashboard__tile"><span class="dashboard__tile-label">Voti</span><b class="dashboard__tile-value">{{ fmt(data.today.votes) }}</b><small class="dashboard__tile-hint">{{ pct(data.today.anonShare) }} senza account · {{ fmt(data.now.votesLastHour) }} nell'ultima ora</small></div>
        <div class="dashboard__tile"><span class="dashboard__tile-label">Nuovi utenti</span><b class="dashboard__tile-value">{{ fmt(data.today.signups) }}</b><small class="dashboard__tile-hint">{{ fmt(data.totals.users) }} in totale</small></div>
        <div class="dashboard__tile"><span class="dashboard__tile-label">Foto caricate</span><b class="dashboard__tile-value">{{ fmt(data.today.uploads) }}</b><small class="dashboard__tile-hint">{{ fmt(data.totals.photos) }} pubblicate</small></div>
        <NuxtLink to="/admin/pubblicita" class="dashboard__tile"><span class="dashboard__tile-label">Pubblicità</span><b class="dashboard__tile-value">{{ fmt(data.today.adClicks) }} <em class="dashboard__tile-unit">clic</em></b><small class="dashboard__tile-hint">{{ fmt(data.today.adViews) }} visualizzazioni · CTR {{ pct(ctr) }}</small></NuxtLink>
      </div>

      <NuxtLink v-if="data.activeChallenge" :to="`/sfide/${data.activeChallenge.slug}`" class="dashboard__challenge">
        <span class="dashboard__challenge-emoji" aria-hidden="true">{{ data.activeChallenge.emoji }}</span>
        <span class="dashboard__challenge-text"><b>{{ data.activeChallenge.title }}</b><small>{{ data.activeChallenge.entries }} in gara · finisce {{ timeUntil(data.activeChallenge.endsAt) }}</small></span>
      </NuxtLink>

      <h2 class="admin-page__heading">Ultime due settimane</h2>
      <div class="dashboard__charts">
        <AdminBars title="Voti" :days="series('votes')" />
        <AdminBars title="Nuovi utenti" :days="series('signups')" color="var(--mint)" />
        <AdminBars title="Foto caricate" :days="series('uploads')" color="var(--sun-deep)" />
      </div>

      <h2 class="admin-page__heading">Cosa sta succedendo</h2>
      <ol class="dashboard__feed">
        <li v-for="(a, i) in data.activity" :key="i" class="dashboard__event">
          <span class="dashboard__event-emoji" aria-hidden="true">{{ a.emoji }}</span>
          <NuxtLink v-if="a.link" :to="a.link" class="dashboard__event-text dashboard__event-text--link">{{ a.text }}</NuxtLink>
          <span v-else class="dashboard__event-text">{{ a.text }}</span>
          <time :datetime="a.at" class="dashboard__event-time">{{ timeAgo(a.at) }}</time>
        </li>
        <li v-if="!data.activity.length" class="dashboard__event u-muted">Ancora niente da mostrare.</li>
      </ol>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: panoramica di oggi e delle ultime due settimane
.dashboard {
  &__live { display: flex; align-items: center; gap: 7px; font-weight: 800; font-size: 13px; color: var(--muted); }

  &__pulse { width: 9px; height: 9px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 0 4px color-mix(in srgb, var(--mint) 25%, transparent); }

  &__todo { @include stack($space-3); }

  &__task { display: flex; align-items: center; gap: $space-3; padding: 14px 16px; border-radius: $radius-md; text-decoration: none; background: var(--sun); color: var(--sun-ink); font-weight: 800; }

  &__task-count { font-size: 22px; font-family: var(--display); }

  &__arrow { margin-left: auto; font-size: 18px; }

  &__done { margin: 0; padding: 12px 16px; border-radius: $radius-md; background: var(--surface); font-weight: 800; color: var(--muted); }

  &__tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-4;

    @include mq(lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__tile { @include card(12px 14px, 20px); @include stack(2px); @include plain-link(var(--ink)); min-width: 0; }

  &__tile-label { font-size: 13px; font-weight: 800; color: var(--muted); }

  &__tile-value { font-family: var(--display); font-size: 28px; line-height: 1.15; font-variant-numeric: tabular-nums; }

  &__tile-unit { font-style: normal; font-size: 15px; color: var(--muted); }

  &__tile-hint { font-size: 12px; color: var(--muted); font-weight: 700; }

  &__challenge { display: flex; align-items: center; gap: $space-5; @include card(12px 14px, 20px); @include plain-link(var(--ink)); }

  &__challenge-emoji { font-size: 28px; }

  &__challenge-text {
    display: flex;
    flex-direction: column;

    small { color: var(--muted); font-weight: 700; }
  }

  &__charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: $space-4; }

  &__feed { list-style: none; margin: 0; @include card(6px 0, 22px); }

  &__event {
    display: flex;
    align-items: baseline;
    gap: $space-4;
    padding: 8px 14px;
    font-size: 14px;

    & + & { border-top: 1px solid var(--line); }
  }

  &__event-emoji { width: 20px; text-align: center; flex-shrink: 0; }

  &__event-text {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;

    &--link {
      @include plain-link(var(--ink));
      font-weight: 700;

      &:hover { text-decoration: underline; }
    }
  }

  &__event-time { color: var(--muted); font-size: 12px; font-weight: 700; white-space: nowrap; }
}
</style>
