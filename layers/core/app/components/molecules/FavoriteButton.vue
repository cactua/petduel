<script setup lang="ts">
/**
 * Molecola: salva un partecipante tra i preferiti (/favorites). È privato: il proprietario non lo sa.
 * Chi non è collegato viene mandato ad accedere
 */
const props = defineProps<{ petId: number }>()

const { loggedIn } = useUserSession()
const route = useRoute()
const { data } = await useFetch<{ saved: boolean }>(() => `/api/pets/${props.petId}/favorite`, { lazy: true, server: false })
const saved = ref(false)
watch(data, d => (saved.value = !!d?.saved), { immediate: true })
const busy = ref(false)

async function toggle() {
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  busy.value = true
  try {
    const res = await $fetch<{ saved: boolean }>(`/api/pets/${props.petId}/favorite`, { method: 'POST', body: { saved: !saved.value } })
    saved.value = res.saved
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <button type="button" class="favorite-button" :class="{ 'is-saved': saved }" :aria-pressed="saved" :disabled="busy" @click="toggle">
    {{ saved ? `★ ${$t('favorites.saved')}` : `☆ ${$t('favorites.save')}` }}
  </button>
</template>

<style lang="scss" scoped>
.favorite-button {
  border: 2px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  @include pill(8px, 14px);
  font: inherit;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;

  &.is-saved { border-color: var(--sun); background: color-mix(in srgb, var(--sun) 25%, var(--surface)); }

  &:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
}
</style>
