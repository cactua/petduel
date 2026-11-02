<script setup lang="ts">
import type { VotedPet } from '#shared/models'

// Pagina: i partecipanti scelti negli ultimi duelli, per ritrovarli. Da qui si apre il profilo di chi li ha caricati
// (con gli altri suoi personaggi) o quello dell'artista indicato
const { t } = useI18n()
useHead({ title: () => t('voted.title') })
const { data, pending } = useLazyFetch<VotedPet[]>('/api/me/voted', { server: false })
</script>

<template>
  <section class="voted">
    <header class="voted__header">
      <h1 class="voted__title">♥ {{ $t('voted.title') }}</h1>
      <p class="voted__lead">{{ $t('voted.lead') }}</p>
    </header>

    <p v-if="!pending && !data?.length" class="voted__empty">
      {{ $t('voted.empty') }} <NuxtLink to="/">{{ $t('voted.goVote') }}</NuxtLink>
    </p>

    <ul v-else class="voted__grid">
      <li v-for="p in data" :key="p.id" class="voted__item">
        <NuxtLink :to="`/pet/${p.id}`" class="voted__photo-link" :aria-label="p.name">
          <picture><source v-for="s in photoSources(p.image, 'v', '(min-width: 760px) 190px, 46vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="p.image" :alt="p.name" loading="lazy" class="voted__img"></picture>
        </NuxtLink>
        <div class="voted__info">
          <NuxtLink :to="`/pet/${p.id}`" class="voted__name">{{ p.name }}</NuxtLink>
          <NuxtLink :to="`/u/${p.owner}`" class="voted__line">👤 @{{ p.owner }}</NuxtLink>
          <CreditLink v-if="p.credit" :url="p.credit.url" class="voted__line voted__artist">🎨 {{ p.credit.text }}</CreditLink>
          <small class="voted__when">{{ timeAgo(p.votedAt) }}</small>
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.voted {
  @include stack($space-6);
  padding-bottom: 16px;

  &__title { font-family: var(--display); font-size: clamp(24px, 5vw, 32px); }

  &__lead { margin: 4px 0 0; color: var(--muted); line-height: 1.5; }

  &__empty { text-align: center; color: var(--muted); padding: 30px 0; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(46%, 190px), 1fr));
    gap: $space-5;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    @include card(0, 20px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; background: var(--line); }

  &__info { @include stack(2px); padding: 10px 12px 12px; min-width: 0; }

  &__name { @include plain-link(var(--ink)); font-weight: 900; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__line {
    @include plain-link(var(--muted));
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover { color: var(--ink); }
  }

  &__artist { color: var(--coral-deep); }

  &__when { color: var(--muted); font-size: 11px; }
}
</style>
