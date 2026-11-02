<script setup lang="ts">
// Atomo: link all'autore di un'immagine. Un artista registrato porta al suo profilo sul sito ("/u/…"),
// un link scritto da chi carica si apre fuori, senza "follow"; senza link resta solo il nome
defineProps<{ url: string | null }>()
</script>

<template>
  <NuxtLink v-if="url?.startsWith('/')" :to="url"><slot /></NuxtLink>
  <a v-else-if="url" :href="url" target="_blank" rel="noopener noreferrer nofollow ugc"><slot /></a>
  <span v-else><slot /></span>
</template>
