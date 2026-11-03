<script setup lang="ts">
import type { ChallengeList } from '#shared/models'

const { t } = useI18n()
useHead({ title: () => `${t('challenges.title')}` })
const { data } = await useFetch<ChallengeList>('/api/challenges')
</script>

<template>
  <section class="challenges-page">
    <header class="challenges-page__header">
      <h1 class="challenges-page__title">{{ $t('challenges.title') }}</h1>
      <p class="challenges-page__lead">{{ $t('challenges.lead') }}</p>
    </header>

    <div v-if="data?.current.length" class="challenges-page__current">
      <ChallengeCard v-for="c in data.current" :key="c.id" :challenge="c" big />
    </div>

    <template v-if="data?.upcoming.length">
      <h2 class="challenges-page__heading">{{ $t('challenges.upcoming') }}</h2>
      <div class="challenges-page__grid">
        <ChallengeCard v-for="c in data.upcoming" :key="c.id" :challenge="c" />
      </div>
    </template>

    <template v-if="data?.past.length">
      <h2 class="challenges-page__heading">{{ $t('challenges.past') }}</h2>
      <div class="challenges-page__grid">
        <ChallengeCard v-for="c in data.past" :key="c.id" :challenge="c" />
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: elenco delle sfide (in corso, in arrivo, concluse)
.challenges-page {
  @include stack($space-6);
  padding-bottom: 12px;

  &__title { font-size: 26px; }

  &__lead { margin: $space-1 0 0; color: var(--muted); max-width: 60ch; }

  &__heading { font-size: 18px; margin-top: $space-3; }

  &__current { @include stack($space-4); }

  &__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: $space-4; }
}
</style>
