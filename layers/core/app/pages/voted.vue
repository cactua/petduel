<script setup lang="ts">
import type { VotedPet } from '#shared/models'

// Pagina: i partecipanti scelti negli ultimi duelli e nelle sfide, per ritrovarli. Da qui si apre il profilo di chi li ha caricati
// (con gli altri suoi personaggi) o quello dell'artista indicato
const { t } = useI18n()
useHead({ title: () => t('voted.title') })
const { data, pending } = useLazyFetch<VotedPet[]>('/api/me/voted', { server: false })
</script>

<template>
  <section class="voted">
    <header>
      <h1 class="voted__title">♥ {{ $t('voted.title') }}</h1>
      <p class="voted__lead">{{ $t('voted.lead') }}</p>
    </header>

    <p v-if="!pending && !data?.length" class="voted__empty">
      {{ $t('voted.empty') }} <NuxtLink to="/">{{ $t('voted.goVote') }}</NuxtLink>
    </p>

    <ul v-else class="voted__grid">
      <PetTile v-for="p in data" :id="p.id" :key="p.id" :name="p.name" :image="p.image" :owner="p.owner" :credit="p.credit">
        <NuxtLink v-if="p.challenge" :to="`/challenges/${p.challenge.slug}`" class="pet-tile__line">🏆 {{ challengeText(p.challenge).title }}</NuxtLink>
        <small class="pet-tile__when">{{ timeAgo(p.votedAt) }}</small>
      </PetTile>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.voted { @include pet-list-page; }
</style>
