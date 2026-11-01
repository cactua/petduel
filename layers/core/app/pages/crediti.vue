<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('credits.title')} · PetDuel` })
const { data } = await useFetch<{ petId: number, name: string, image: string, credit: string, url: string | null }[]>('/api/credits')
</script>

<template>
  <section class="credits">
    <h1 class="credits__title">{{ $t('credits.title') }}</h1>
    <p class="credits__lead">{{ $t('credits.lead') }}</p>
    <ul class="credits__list">
      <li v-for="c in data" :key="c.image" class="credits__item">
        <picture><source v-for="s in photoSources(c.image, 'v', '44px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="c.image" :alt="c.name" loading="lazy" class="credits__img"></picture>
        <div class="credits__text">
          <NuxtLink :to="`/pet/${c.petId}`" class="credits__pet">{{ c.name }}</NuxtLink>
          <a v-if="c.url" :href="c.url" target="_blank" rel="noopener noreferrer" class="credits__author">{{ c.credit }}</a>
          <span v-else class="credits__author">{{ c.credit }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: autori e licenze delle foto
.credits {
  @include stack($space-5);
  padding-bottom: 12px;

  &__title { font-size: 24px; }

  &__lead { margin: 0; color: var(--muted); font-size: 14px; max-width: 65ch; }

  &__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: $space-3; }

  &__item { display: flex; gap: $space-4; align-items: center; background: var(--surface); border-radius: $radius-md; padding: $space-3; min-width: 0; box-shadow: $shadow-flat; }

  &__img { width: 44px; height: 58px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }

  &__text { min-width: 0; display: flex; flex-direction: column; font-size: 13px; }

  &__pet { font-weight: 800; @include plain-link(var(--ink)); font-size: 15px; }

  &__author { color: var(--muted); overflow-wrap: anywhere; }
}
</style>
