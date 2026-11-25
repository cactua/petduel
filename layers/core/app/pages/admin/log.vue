<script setup lang="ts">
import { ADMIN_LOG_KINDS, describeAdminAction, type AdminLogKind } from '#shared/adminLog'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Registro · Admin' })

// Chi ha fatto cosa nel pannello admin (ultime 300 azioni). Non si modifica dal sito
interface Row { id: number, admin: string, action: string, target: string, detail: string, at: string }
const { data, error } = await useFetch<Row[]>('/api/admin/log')

const rows = computed(() => (data.value ?? []).map(r => ({ ...r, ...describeAdminAction(r.action, r.detail) })))

// Filtro per categoria, con quante azioni ci sono in ognuna
const kind = ref<AdminLogKind | null>(null)
const kinds = computed(() => {
  const counts = new Map<AdminLogKind, number>()
  for (const r of rows.value) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
  return (Object.keys(ADMIN_LOG_KINDS) as AdminLogKind[]).filter(k => counts.has(k)).map(k => ({ id: k, label: ADMIN_LOG_KINDS[k], n: counts.get(k)! }))
})
const shown = computed(() => (kind.value ? rows.value.filter(r => r.kind === kind.value) : rows.value))

// Raggruppate per giorno: "Oggi", "Ieri", poi la data
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('sv-SE')
function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - 864e5)
  if (dayKey(iso) === today.toLocaleDateString('sv-SE')) return 'Oggi'
  if (dayKey(iso) === yesterday.toLocaleDateString('sv-SE')) return 'Ieri'
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const days = computed(() => {
  const out: { key: string, label: string, items: typeof shown.value }[] = []
  for (const r of shown.value) {
    const key = dayKey(r.at)
    if (out.at(-1)?.key !== key) out.push({ key, label: dayLabel(r.at), items: [] })
    out.at(-1)!.items.push(r)
  }
  return out
})
const time = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const pretty = (detail: string) => {
  try {
    return JSON.stringify(JSON.parse(detail), null, 2)
  }
  catch {
    return detail
  }
}
</script>

<template>
  <section class="admin-page admin-log">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Registro delle azioni</h1>
    </header>
    <p class="admin-page__lead">Ogni modifica fatta da un admin: approvazioni, rifiuti, utenti, sfide, pubblicità. Le password non vengono mai scritte.</p>
    <p v-if="error" class="error" role="alert">Non riesco a caricare il registro</p>
    <p v-else-if="data && !data.length" class="admin-page__empty">Ancora nessuna azione registrata.</p>
    <template v-else>
      <div v-if="kinds.length > 1" class="admin-log__filter" role="group" aria-label="Mostra">
        <button type="button" class="chip" :aria-pressed="kind === null" @click="kind = null">Tutte <span class="admin-log__count">{{ rows.length }}</span></button>
        <button v-for="k in kinds" :key="k.id" type="button" class="chip" :aria-pressed="kind === k.id" @click="kind = k.id">
          {{ k.label }} <span class="admin-log__count">{{ k.n }}</span>
        </button>
      </div>

      <section v-for="d in days" :key="d.key" class="admin-log__day" :aria-labelledby="`day-${d.key}`">
        <h2 :id="`day-${d.key}`" class="admin-log__day-title">{{ d.label }}</h2>
        <ol class="admin-log__list">
          <li v-for="r in d.items" :key="r.id" class="admin-log__item">
            <span class="admin-log__icon" :class="`admin-log__icon--${r.tone}`" aria-hidden="true">{{ r.icon }}</span>
            <div class="admin-log__body">
              <p class="admin-log__text">{{ r.text }}</p>
              <p class="admin-log__meta">
                <b>@{{ r.admin }}</b>
                <span aria-hidden="true">·</span>
                <time :datetime="r.at">{{ time(r.at) }}</time>
                <span aria-hidden="true">·</span>
                <span>{{ ADMIN_LOG_KINDS[r.kind] }}</span>
              </p>
              <details v-if="r.detail" class="admin-log__raw">
                <summary>Dati inviati</summary>
                <pre><code>{{ r.action }}
{{ pretty(r.detail) }}</code></pre>
              </details>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.admin-log {
  &__filter {
    display: flex;
    gap: $space-2;
    @include scroll-row;

    > * { flex-shrink: 0; }

    @include mq(md) { flex-wrap: wrap; overflow: visible; }
  }

  &__count { font-variant-numeric: tabular-nums; opacity: .7; }

  &__day { @include stack($space-2); }

  &__day-title { margin: $space-3 0 0; font-size: 15px; font-weight: 800; color: var(--muted); }

  &__list { @include card(4px, $radius-lg); list-style: none; margin: 0; }

  &__item {
    display: flex;
    gap: $space-3;
    align-items: flex-start;
    padding: 12px 14px;
    min-width: 0;

    & + & { border-top: 1px solid var(--line); }
  }

  &__icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 16px;
    font-weight: 900;
    background: color-mix(in srgb, var(--line) 60%, var(--surface));
    color: var(--ink);

    &--ok { background: color-mix(in srgb, var(--mint) 22%, var(--surface)); color: color-mix(in srgb, var(--mint) 45%, var(--ink)); }

    &--bad { background: color-mix(in srgb, var(--coral) 18%, var(--surface)); color: var(--link); }
  }

  &__body { @include stack(2px); min-width: 0; flex: 1; }

  &__text { margin: 0; font-weight: 700; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere; }

  &__meta { display: flex; flex-wrap: wrap; gap: 2px 6px; margin: 0; color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }

  &__raw {
    margin-top: 4px;
    font-size: 12px;

    summary { cursor: pointer; color: var(--muted); font-weight: 700; width: fit-content; min-height: 24px; }

    pre { margin: 6px 0 0; padding: 8px 10px; border-radius: 8px; background: var(--bg); overflow-x: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
  }
}
</style>
