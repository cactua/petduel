<script setup lang="ts">
import { TRANSLATED_LOCALES, type AdminChallenge, type AdminChallengeList, type ChallengeStatus } from '#shared/models'
import { speciesName } from '#shared/speciesNames'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Sfide · Admin' })

// Elenco delle sfide nel pannello admin: calendario delle prossime settimane, poi le sfide per stato.
// Creare e modificare si fa in pagine a parte (/admin/challenges/new, /admin/challenges/<id>)
const { data, refresh, error: loadError } = await useFetch<AdminChallengeList>('/api/admin/challenges', { default: () => ({ items: [], hasThemes: false }) })
const items = computed(() => data.value.items)

// Messaggio lasciato dalla pagina di modifica ("Sfida salvata")
const notice = useState<string>('admin-challenge-notice', () => '')
onBeforeUnmount(() => (notice.value = ''))
const error = ref('')

// ── Calendario: le prossime 8 settimane da lunedì, con le sfide di ognuna o il posto libero ──
const isoDay = (d: Date) => d.toLocaleDateString('sv-SE')
const monday = (d = new Date()) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}
const weeks = computed(() => {
  const first = monday()
  return Array.from({ length: 8 }, (_, i) => {
    const start = new Date(first)
    start.setDate(first.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const list = items.value.filter(c => new Date(c.startsAt) < end && new Date(c.endsAt) > start)
    return { key: isoDay(start), start, current: i === 0, list }
  })
})
const weekLabel = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

// ── Elenco per stato, con ricerca ──
const counts = computed(() => ({
  active: items.value.filter(c => c.status === 'active').length,
  upcoming: items.value.filter(c => c.status === 'upcoming').length,
  ended: items.value.filter(c => c.status === 'ended').length,
}))
const status = ref<ChallengeStatus>('active')
watch(counts, (c) => {
  if (!c[status.value]) status.value = c.active ? 'active' : c.upcoming ? 'upcoming' : 'ended'
}, { immediate: true })
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = items.value.filter(c => c.status === status.value && (!q || `${c.title} ${c.description}`.toLowerCase().includes(q)))
  // Programmate dalla più vicina; in corso e concluse dalla più recente
  return status.value === 'upcoming' ? [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : list
})
const STATUS_TABS: { id: ChallengeStatus, label: string }[] = [
  { id: 'active', label: 'In corso' },
  { id: 'upcoming', label: 'Programmate' },
  { id: 'ended', label: 'Concluse' },
]

// ── Righe ──
const range = (c: AdminChallenge) => `${shortDate(c.startsAt)} → ${shortDate(new Date(new Date(c.endsAt).getTime() - 1).toISOString())}`
function when(c: AdminChallenge) {
  if (c.status === 'active') return `Finisce ${timeUntil(c.endsAt)}`
  if (c.status === 'upcoming') return `Inizia ${timeUntil(c.startsAt)}`
  return 'Conclusa'
}
const missingLangs = (c: AdminChallenge) => TRANSLATED_LOCALES.length - c.translated.length

// Elimina: solo senza partecipanti, con conferma sulla riga
const confirming = ref<number | null>(null)
async function remove(c: AdminChallenge) {
  error.value = ''
  try {
    await $fetch(`/api/admin/challenges/${c.id}`, { method: 'DELETE' })
    notice.value = `Sfida “${c.title}” eliminata.`
    confirming.value = null
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
}
</script>

<template>
  <section class="admin-page challenge-admin">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Sfide</h1>
      <NuxtLink to="/admin/challenges/new" class="btn btn--primary challenge-admin__new">+ Nuova sfida</NuxtLink>
    </header>
    <p class="admin-page__lead">
      Ogni sfida dura una settimana.
      <template v-if="data.hasThemes">Le settimane libere prendono da sole il tema successivo del calendario; una sfida programmata qui lo sostituisce, se non ha ancora partecipanti.</template>
    </p>
    <p v-if="notice" class="admin-page__notice" role="status">{{ notice }}</p>
    <p v-if="error || loadError" class="error" role="alert">{{ error || 'Non riesco a caricare le sfide' }}</p>

    <!-- Calendario delle prossime settimane -->
    <section class="challenge-admin__calendar" aria-labelledby="cal-title">
      <h2 id="cal-title" class="admin-page__heading">Prossime settimane</h2>
      <ol class="challenge-admin__weeks">
        <li v-for="w in weeks" :key="w.key" class="challenge-admin__week" :class="{ 'is-current': w.current, 'is-free': !w.list.length }">
          <span class="challenge-admin__week-date">
            {{ w.current ? 'Questa settimana' : `Dal ${weekLabel(w.start)}` }}
          </span>
          <template v-if="w.list.length">
            <NuxtLink v-for="c in w.list" :key="c.id" :to="`/admin/challenges/${c.id}`" class="challenge-admin__week-item">
              <span class="challenge-admin__week-emoji" aria-hidden="true">{{ c.emoji }}</span>
              <span class="challenge-admin__week-title">{{ c.title }}</span>
            </NuxtLink>
          </template>
          <template v-else>
            <span class="challenge-admin__week-free">{{ data.hasThemes ? 'Tema automatico' : 'Nessuna sfida' }}</span>
            <NuxtLink v-if="!w.current" :to="`/admin/challenges/new?start=${w.key}`" class="challenge-admin__week-add">
              + Programma<span class="u-visually-hidden"> dal {{ weekLabel(w.start) }}</span>
            </NuxtLink>
          </template>
        </li>
      </ol>
    </section>

    <!-- Elenco per stato -->
    <section class="challenge-admin__list-wrap" aria-labelledby="list-title">
      <h2 id="list-title" class="u-visually-hidden">Elenco delle sfide</h2>
      <div class="challenge-admin__toolbar">
        <div class="segmented" role="group" aria-label="Mostra">
          <button
            v-for="s in STATUS_TABS" :key="s.id" type="button" class="segmented__option challenge-admin__seg" :aria-pressed="status === s.id"
            @click="status = s.id"
          >
            {{ s.label }} <span class="challenge-admin__seg-count">{{ counts[s.id] }}</span>
          </button>
        </div>
        <label class="challenge-admin__search">
          <span class="u-visually-hidden">Cerca una sfida</span>
          <input v-model="query" type="search" placeholder="Cerca…" class="input challenge-admin__search-input">
        </label>
      </div>

      <ul v-if="shown.length" class="challenge-admin__rows">
        <li v-for="c in shown" :key="c.id" class="challenge-admin__row" :class="`challenge-admin__row--${c.status}`">
          <span class="challenge-admin__emoji" aria-hidden="true">{{ c.emoji }}</span>
          <div class="challenge-admin__body">
            <h3 class="challenge-admin__title">
              <NuxtLink :to="`/admin/challenges/${c.id}`" class="challenge-admin__title-link">{{ c.title }}</NuxtLink>
            </h3>
            <p class="challenge-admin__desc">{{ c.description }}</p>
            <p class="challenge-admin__meta">
              <span class="challenge-admin__status" :class="`challenge-admin__status--${c.status}`">{{ when(c) }}</span>
              <span>{{ range(c) }}</span>
              <span v-if="c.status !== 'upcoming' || c.entries">{{ c.entries }} in gara</span>
            </p>
            <p class="challenge-admin__tags">
              <span v-if="c.automatic" class="challenge-admin__tag">🤖 Automatica</span>
              <span v-if="c.species" class="challenge-admin__tag">Solo {{ speciesName(c.species, 'many').toLowerCase() }}</span>
              <span v-if="c.adoptionOnly" class="challenge-admin__tag">🏠 Solo rifugi</span>
              <span v-if="missingLangs(c)" class="challenge-admin__tag challenge-admin__tag--warn">⚠ {{ missingLangs(c) }} traduzioni mancanti</span>
            </p>
            <p v-if="c.winner" class="challenge-admin__winner">🏆 <b>{{ c.winner.name }}</b> · @{{ c.winner.owner }}</p>
            <p v-else-if="c.leaders.length" class="challenge-admin__winner">In testa: <b>{{ c.leaders[0]!.name }}</b></p>
          </div>
          <div class="challenge-admin__actions">
            <NuxtLink :to="`/admin/challenges/${c.id}`" class="btn btn--ghost btn--sm" :aria-label="`Modifica ${c.title}`">Modifica</NuxtLink>
            <NuxtLink :to="`/challenges/${c.slug}`" class="btn btn--ghost btn--sm" :aria-label="`Apri la pagina pubblica di ${c.title}`">Apri</NuxtLink>
            <template v-if="!c.entries">
              <template v-if="confirming === c.id">
                <button type="button" class="btn btn--danger btn--sm" @click="remove(c)">Elimina davvero</button>
                <button type="button" class="btn btn--ghost btn--sm" @click="confirming = null">No</button>
              </template>
              <button v-else type="button" class="btn btn--ghost btn--sm challenge-admin__delete" :aria-label="`Elimina ${c.title}`" @click="confirming = c.id">Elimina</button>
            </template>
          </div>
        </li>
      </ul>
      <div v-else class="challenge-admin__empty">
        <p>{{ query ? 'Nessuna sfida trovata.' : status === 'upcoming' ? 'Nessuna sfida programmata.' : status === 'active' ? 'Nessuna sfida in corso.' : 'Nessuna sfida conclusa negli ultimi sei mesi.' }}</p>
        <NuxtLink v-if="status !== 'ended'" to="/admin/challenges/new" class="btn btn--primary">+ Nuova sfida</NuxtLink>
      </div>
    </section>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: calendario e elenco delle sfide
.challenge-admin {
  &__new { margin-left: auto; }

  // ── Calendario ──
  &__calendar { @include stack($space-2); }

  &__weeks {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(150px, 1fr);
    gap: $space-2;
    margin: 0;
    padding: 2px 2px 8px;
    list-style: none;
    overflow-x: auto;
    scroll-snap-type: x proximity;

    @include mq(lg) { grid-auto-flow: row; grid-template-columns: repeat(4, 1fr); overflow: visible; }
  }

  &__week {
    @include stack(6px);
    min-height: 96px;
    padding: 10px 12px;
    border-radius: $radius-md;
    background: var(--surface);
    box-shadow: 0 6px 16px -12px var(--shadow);
    scroll-snap-align: start;

    &.is-current { outline: 2px solid var(--ink); }

    &.is-free { background: transparent; box-shadow: none; border: 2px dashed var(--line); }
  }

  &__week-date { @include eyebrow; }

  &__week-item {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-weight: 800;
    font-size: 14px;
    @include plain-link(var(--ink));

    &:hover .challenge-admin__week-title, &:focus-visible .challenge-admin__week-title { text-decoration: underline; }
  }

  &__week-emoji { font-size: 20px; }

  &__week-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__week-free { color: var(--muted); font-size: 13px; font-weight: 700; }

  &__week-add { margin-top: auto; color: var(--link); font-weight: 800; font-size: 13px; }

  // ── Elenco ──
  &__list-wrap { @include stack($space-3); }

  &__toolbar { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; justify-content: space-between; }

  &__seg { white-space: nowrap; }

  &__seg-count { opacity: .65; font-variant-numeric: tabular-nums; }

  &__search { flex: 0 1 240px; }

  &__search-input { min-height: 40px; }

  &__rows { list-style: none; margin: 0; padding: 0; @include stack($space-3); }

  &__row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: $space-3 $space-4;
    padding: 14px 16px;
    border-radius: $radius-lg;
    background: var(--surface);
    box-shadow: $shadow-card;
    border-left: 5px solid var(--line);

    &--active { border-left-color: var(--mint); }

    &--upcoming { border-left-color: var(--sun-deep); }

    @include mq(md) { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; }
  }

  &__emoji {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: var(--bg);
    font-size: 30px;
  }

  &__body { @include stack(4px); min-width: 0; }

  &__title { margin: 0; font-size: 18px; }

  &__title-link { @include plain-link(var(--ink)); &:hover, &:focus-visible { text-decoration: underline; } }

  &__desc { margin: 0; color: var(--muted); font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  &__meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0; font-size: 13px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }

  &__status {
    padding: 1px 8px;
    border-radius: $radius-pill;
    color: var(--ink);
    background: color-mix(in srgb, var(--line) 60%, var(--surface));

    &--active { background: color-mix(in srgb, var(--mint) 22%, var(--surface)); }

    &--upcoming { background: color-mix(in srgb, var(--sun) 35%, var(--surface)); }
  }

  &__tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; &:empty { display: none; } }

  &__tag {
    padding: 2px 8px;
    border-radius: $radius-pill;
    border: 1px solid var(--line);
    font-size: 12px;
    font-weight: 800;

    &--warn { border-color: color-mix(in srgb, var(--sun-deep) 60%, var(--line)); background: color-mix(in srgb, var(--sun) 20%, var(--surface)); }
  }

  &__winner { margin: 0; font-size: 14px; }

  &__actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;

    @include mq(md) { grid-column: auto; justify-content: flex-end; max-width: 280px; }
  }

  &__delete { color: var(--link); }

  &__empty {
    @include stack($space-3);
    align-items: center;
    padding: $space-6;
    border: 2px dashed var(--line);
    border-radius: $radius-lg;
    text-align: center;
    color: var(--muted);
    font-weight: 700;

    p { margin: 0; }
  }
}
</style>
