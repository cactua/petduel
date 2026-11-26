<script setup lang="ts">
// Vecchio indirizzo con il numero (/pet/<id>, /character/<id> dove site.entryPath lo rinomina) e link negli avvisi:
// porta alla pagina con il nome, /u/<proprietario>/<nome>, tenendo ?challenge e ?share
const route = useRoute()
const { data, error } = await useFetch<{ url: string }>(() => `/api/pets/${route.params.id}/url`)
if (data.value) await navigateTo({ path: data.value.url, query: route.query }, { replace: true, redirectCode: 301 })
</script>

<template>
  <section class="pet-redirect">
    <p v-if="error" class="pet-redirect__empty">{{ $t('pet.notFound') }}</p>
  </section>
</template>

<style lang="scss" scoped>
.pet-redirect__empty { text-align: center; color: var(--muted); padding: 30px 0; }
</style>
