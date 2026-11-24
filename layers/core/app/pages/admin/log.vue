<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Registro · Admin' })

// Chi ha fatto cosa nel pannello admin (ultime 300 azioni). Non si modifica dal sito
const { data, error } = await useFetch<{ id: number, admin: string, action: string, target: string, detail: string, at: string }[]>('/api/admin/log')
const when = (iso: string) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
</script>

<template>
  <section class="admin-page admin-log">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Registro delle azioni</h1>
    </header>
    <p class="admin-page__lead">Ogni modifica fatta da un admin: approvazioni, rifiuti, utenti, sfide, pubblicità. Le password non vengono mai scritte.</p>
    <p v-if="error" class="error" role="alert">Non riesco a caricare il registro</p>
    <p v-else-if="data && !data.length" class="admin-page__empty">Ancora nessuna azione registrata.</p>
    <ol v-else class="admin-log__list">
      <li v-for="r in data" :key="r.id" class="admin-log__item">
        <span class="admin-log__when">{{ when(r.at) }}</span>
        <b>@{{ r.admin }}</b>
        <code class="admin-log__action">{{ r.action }}</code>
        <span v-if="r.detail" class="admin-log__detail">{{ r.detail }}</span>
      </li>
    </ol>
  </section>
</template>

<style lang="scss" scoped>
.admin-log {
  &__list { list-style: none; margin: 0; padding: 0; @include stack($space-2); }

  &__item { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px; min-width: 0; }

  &__when { color: var(--muted); font-variant-numeric: tabular-nums; }

  &__action { overflow-wrap: anywhere; }

  &__detail { flex-basis: 100%; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
}
</style>
