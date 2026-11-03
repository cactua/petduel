<script setup lang="ts">
import type { FavoritePet } from '#shared/models'

// Pagina: i partecipanti salvati con "Salva" dalla loro pagina. Privata: la vede solo chi li ha salvati
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => t('favorites.title') })
const { data, pending } = useLazyFetch<FavoritePet[]>('/api/me/favorites', { server: false })
</script>

<template>
  <section class="favorites">
    <header>
      <h1 class="favorites__title">★ {{ $t('favorites.title') }}</h1>
      <p class="favorites__lead">{{ $t('favorites.lead') }}</p>
    </header>

    <p v-if="!pending && !data?.length" class="favorites__empty">{{ $t('favorites.empty') }}</p>

    <ul v-else class="favorites__grid">
      <PetTile v-for="p in data" :id="p.id" :key="p.id" :name="p.name" :image="p.image" :owner="p.owner" :credit="p.credit" />
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.favorites { @include pet-list-page; }
</style>
