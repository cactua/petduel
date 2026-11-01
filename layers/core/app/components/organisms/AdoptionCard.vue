<script setup lang="ts">
import type { PetGallery } from '#shared/models'

// Punto di aggancio: la vera scheda di adozione sta in layers/shelters e prende il posto di questa.
// Sui siti senza rifugi la pagina del pet la include lo stesso, ma non mostra niente
defineProps<{ pet: PetGallery, manage?: boolean }>()
defineEmits<{ changed: [] }>()
</script>

<template>
  <template v-if="false" />
</template>
