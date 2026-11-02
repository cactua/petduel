<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

// Cornice comune di tutte le pagine admin: menu con i numeri di ciò che aspetta.
// Le pagine figlie lo aggiornano con refreshNuxtData('admin-todo') dopo un'azione
const { data: todo, refresh } = await useFetch<{ photos: number, shelters: number, reports: number }>('/api/admin/todo', { key: 'admin-todo' })
const route = useRoute()
watch(() => route.path, () => refresh())
const { features } = useAppConfig()

const items = computed(() => [
  { to: '/admin', label: 'Panoramica', emoji: '📊', exact: true },
  { to: '/admin/foto', label: 'Foto', emoji: '📸', badge: todo.value?.photos },
  { to: '/admin/segnalazioni', label: 'Segnalazioni', emoji: '⚑', badge: todo.value?.reports },
  { to: '/admin/utenti', label: 'Utenti', emoji: '👥' },
  ...(features.shelters ? [{ to: '/admin/rifugi', label: 'Rifugi', emoji: '🏠', badge: todo.value?.shelters }] : []),
  { to: '/admin/sfide', label: 'Sfide', emoji: '🏁' },
  { to: '/admin/pubblicita', label: 'Pubblicità', emoji: '📣' },
])
const isActive = (to: string, exact?: boolean) => (exact ? route.path === to : route.path.startsWith(to))
</script>

<template>
  <div class="admin-shell">
    <nav class="admin-shell__menu" aria-label="Sezioni admin">
      <NuxtLink
        v-for="i in items" :key="i.to" :to="i.to" class="admin-shell__link" :class="{ 'is-active': isActive(i.to, i.exact) }"
        :aria-current="isActive(i.to, i.exact) ? 'page' : undefined"
      >
        <span aria-hidden="true">{{ i.emoji }}</span>{{ i.label }}
        <b v-if="i.badge" class="admin-shell__badge" :aria-label="`${i.badge} in attesa`">{{ i.badge > 99 ? '99+' : i.badge }}</b>
      </NuxtLink>
    </nav>
    <div class="admin-shell__content">
      <NuxtPage />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Pagina: contenitore del pannello admin con il menu delle sezioni
.admin-shell {
  @include stack($space-6);
  padding-bottom: 12px;
  min-width: 0;

  @include mq(md) { flex-direction: row; align-items: flex-start; gap: 24px; }

  // Telefono: una riga che scorre; computer: colonna fissa a sinistra
  &__menu {
    display: flex;
    gap: $space-2;
    @include scroll-row;
    margin-inline: -16px;
    padding-inline: 16px;

    @include mq(md) { position: sticky; top: 12px; flex-direction: column; width: 190px; flex-shrink: 0; margin: 0; padding: 0; overflow: visible; }
  }

  &__link {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    @include pill(8px, 14px);
    background: var(--surface);
    @include plain-link(var(--ink));
    font-weight: 800;
    font-size: 14px;
    box-shadow: $shadow-flat;

    @include mq(md) { border-radius: 16px; padding: 10px 14px; }

    &.is-active { background: var(--ink); color: var(--bg); box-shadow: none; }
  }

  &__badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: $radius-pill;
    display: grid;
    place-items: center;
    background: var(--action);
    color: #fff;
    font-size: 11px;
    font-variant-numeric: tabular-nums;

    @include mq(md) { margin-left: auto; }
  }

  &__content { min-width: 0; flex: 1; }
}
</style>
