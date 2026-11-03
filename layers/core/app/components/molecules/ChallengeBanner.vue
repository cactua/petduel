<script setup lang="ts">
import type { ChallengeList } from '#shared/models'

// Striscia discreta in home: porta alla sfida della settimana senza disturbare i duelli
const { data } = useLazyFetch<ChallengeList>('/api/challenges', { server: false })
const challenge = computed(() => data.value?.current[0])
const title = computed(() => (challenge.value ? challengeText(challenge.value).title : ''))
</script>

<template>
  <NuxtLink v-if="challenge" :to="`/challenges/${challenge.slug}`" class="challenge-banner">
    <span class="challenge-banner__emoji" aria-hidden="true">{{ challenge.emoji }}</span>
    <span class="challenge-banner__text">
      <small class="challenge-banner__eyebrow">{{ $t('challenge.ofTheWeek') }}</small>
      <b class="challenge-banner__title">{{ title }}</b>
    </span>
    <span class="challenge-banner__go">{{ $t('challenge.join') }}</span>
  </NuxtLink>
</template>

<style lang="scss" scoped>
// Molecola: la sfida della settimana, cucita come un'etichetta di stoffa
.challenge-banner {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: 9px 12px;
  border-radius: $radius-md;
  background: var(--sun);
  @include plain-link(var(--sun-ink));
  outline: 2px dashed rgba(61, 36, 22, .25);
  outline-offset: -6px;

  &__emoji { font-size: 24px; }

  &__text { min-width: 0; display: flex; flex-direction: column; }

  &__eyebrow { font-size: 10px; font-weight: 900; opacity: .7; text-transform: uppercase; letter-spacing: .08em; }

  &__title { font-family: var(--display); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  &__go { margin-left: auto; font-weight: 900; font-size: 12px; white-space: nowrap; background: var(--sun-ink); color: var(--sun); @include pill(5px, 11px); }

  // Su telefono una riga sola, per lasciare spazio al duello
  @media (max-width: 759px) {
    padding: 6px 8px 6px 12px;
    border-radius: 16px;
    outline-offset: -5px;

    &__emoji { font-size: 20px; }

    &__eyebrow { display: none; }
  }
}
</style>
