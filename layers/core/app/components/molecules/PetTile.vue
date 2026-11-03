<script setup lang="ts">
import type { PhotoCredit } from '#shared/models'

/**
 * Molecola: riquadro di un partecipante nelle liste personali (votati, preferiti, seguiti).
 * Immagine e nome aprono il pet, poi chi l'ha caricato e l'artista; sotto, righe extra nello slot
 */
defineProps<{ id: number, name: string, image: string, owner: string, credit: PhotoCredit | null }>()
</script>

<template>
  <li class="pet-tile">
    <NuxtLink :to="entryUrl(id)" :aria-label="name">
      <picture><source v-for="s in photoSources(image, 'v', '(min-width: 760px) 190px, 46vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="image" :alt="name" loading="lazy" class="pet-tile__img"></picture>
    </NuxtLink>
    <div class="pet-tile__info">
      <NuxtLink :to="entryUrl(id)" class="pet-tile__name">{{ name }}</NuxtLink>
      <NuxtLink :to="`/u/${owner}`" class="pet-tile__line">👤 @{{ owner }}</NuxtLink>
      <CreditLink v-if="credit" :url="credit.url" class="pet-tile__line pet-tile__artist">🎨 {{ credit.text }}</CreditLink>
      <slot />
    </div>
  </li>
</template>

<style lang="scss" scoped>
.pet-tile {
  @include card(0, 20px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &__img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; background: var(--line); }

  &__info { @include stack(2px); padding: 10px 12px 12px; min-width: 0; }

  &__name { @include plain-link(var(--ink)); font-weight: 900; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  // Anche le righe aggiunte dalla pagina nello slot
  &__line, :slotted(.pet-tile__line) {
    @include plain-link(var(--muted));
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover { color: var(--ink); }
  }

  &__artist { color: var(--coral-deep); }

  :slotted(.pet-tile__when) { color: var(--muted); font-size: 11px; }
}
</style>
