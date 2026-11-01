<script setup lang="ts">
import site from '#site'

const { locale } = useI18n()
// Le pagine danno solo il proprio titolo: il nome del sito si aggiunge qui
useHead({
  htmlAttrs: { lang: () => locale.value },
  titleTemplate: title => (title ? `${title} · ${site.name}` : site.name),
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
