<script setup lang="ts">
// Coccarda da esposizione: oro, argento o bronzo
const props = defineProps<{ place: 1 | 2 | 3 | number }>()
const COLORS = {
  1: { petals: '#ffc83d', center: '#ffe08a', edge: '#e9a400', tails: '#e2493a' },
  2: { petals: '#cfd8e3', center: '#eef2f7', edge: '#9aa8b8', tails: '#5b8def' },
  3: { petals: '#eab98f', center: '#f7dcc2', edge: '#b9773f', tails: '#2ec4a0' },
} as const
const c = computed(() => COLORS[props.place as 1 | 2 | 3] ?? COLORS[3])
</script>

<template>
  <svg class="rosette" viewBox="0 0 40 52" aria-hidden="true">
    <path d="M12 30 6 50l8-4 4 6 4-18zM28 30l6 20-8-4-4 6-4-18z" :fill="c.tails" />
    <circle cx="20" cy="18" r="17" :fill="c.petals" />
    <circle cx="20" cy="18" r="12" :fill="c.center" :stroke="c.edge" stroke-width="2" stroke-dasharray="3 2.4" />
    <text x="20" y="23.5" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" :fill="c.edge">{{ place }}</text>
  </svg>
</template>

<style lang="scss" scoped>
// Atomo: coccarda da esposizione
.rosette {
  width: 34px;
  height: 44px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 2px rgba(61, 36, 22, .25));
}
</style>
