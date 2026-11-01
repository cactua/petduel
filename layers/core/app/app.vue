<script setup lang="ts">
import site from '#site'
import { siteBrand } from '#shared/site'

const { locale } = useI18n()
// Le pagine danno solo il proprio titolo: il nome del sito si aggiunge qui
useHead({
  htmlAttrs: { lang: () => locale.value },
  titleTemplate: title => (title ? `${title} · ${site.name}` : site.name),
  // Colore della barra del browser su mobile, come lo sfondo del sito
  meta: [{ name: 'theme-color', content: siteBrand(site).background }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
