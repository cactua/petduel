<script setup lang="ts">
import { SPECIES_EMOJI, type RankedPet } from '#shared/models'

// rankLabel: al posto del numero (es. posizione nella specie, o un simbolo per i pet fuori dalla top)
defineProps<{ pet: RankedPet, score: string, detail: string, mine?: boolean, showSpecies?: boolean, rankLabel?: string | number }>()
</script>

<template>
  <NuxtLink :to="`/pet/${pet.id}`" class="rank-row">
    <span class="rank-row__rank">{{ rankLabel ?? pet.rank }}</span>
    <picture><source v-for="s in photoSources(pet.image, 's', '46px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="pet.image" alt="" class="rank-row__thumb" loading="lazy"></picture>
    <div class="rank-row__who">
      <b class="rank-row__name">
        <span v-if="showSpecies" aria-hidden="true">{{ SPECIES_EMOJI[pet.species] }}</span>
        {{ pet.name }}
        <span v-if="mine" class="rank-row__tag">{{ $t('common.yours') }}</span>
      </b>
      <small class="rank-row__detail">@{{ pet.owner }} · {{ detail }}</small>
    </div>
    <span class="rank-row__score">{{ score }}</span>
  </NuxtLink>
</template>

<style lang="scss" scoped>
// Molecola: una riga di classifica (posizione, foto, nome, punteggio)
.rank-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: 7px 12px 7px 7px;
  @include plain-link(var(--ink));

  &__rank {
    min-width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--bg);
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  &__thumb { width: 46px; height: 46px; border-radius: 15px; object-fit: cover; flex-shrink: 0; }

  &__who { min-width: 0; }

  &__name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__detail { @include line-clamp(2); color: var(--muted); line-height: 1.3; }

  &__tag { font-size: 11px; font-weight: 800; color: #fff; background: var(--coral); @include pill(1px, 7px); vertical-align: 2px; }

  &__score { margin-left: auto; white-space: nowrap; font-weight: 900; color: var(--coral); font-variant-numeric: tabular-nums; }
}
</style>
