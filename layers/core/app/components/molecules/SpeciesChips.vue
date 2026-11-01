<script setup lang="ts">
import { SPECIES, SPECIES_EMOJI, type Species } from '#shared/models'

const model = defineModel<Species | undefined>()

// Sfumatura sul lato dove ci sono altre voci: fa capire che la riga scorre
const row = ref<HTMLElement>()
const more = reactive({ start: false, end: false })
function updateFade() {
  const el = row.value
  if (!el) return
  more.start = el.scrollLeft > 2
  more.end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}
let observer: ResizeObserver | undefined
onMounted(() => {
  // Il sito non ha categorie: la riga non c'è
  if (!row.value) return
  updateFade()
  observer = new ResizeObserver(updateFade)
  observer.observe(row.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    v-if="SPECIES.length"
    ref="row" class="species-chips"
    :class="{ 'species-chips--fade-start': more.start, 'species-chips--fade-end': more.end }"
    role="group" :aria-label="$t('species.filter')" @scroll.passive="updateFade"
  >
    <button type="button" class="species-chips__chip" :class="{ 'is-active': !model }" :aria-pressed="!model" @click="model = undefined">{{ $t('species.all') }}</button>
    <button
      v-for="s in SPECIES" :key="s" type="button" class="species-chips__chip"
      :class="[`species-chips__chip--${s}`, { 'is-active': model === s }]" :aria-pressed="model === s" @click="model = s"
    >
      <span aria-hidden="true">{{ SPECIES_EMOJI[s] }}</span> {{ speciesText(s, 'many') }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
$species: cane, gatto, coniglio, roditore, uccello, rettile, altro;

// Molecola: una riga sola che scorre in orizzontale, così 8 voci non rubano spazio alle card
.species-chips {
  --fade-start: 0px;
  --fade-end: 0px;
  display: flex;
  gap: $space-2;
  @include scroll-row;
  margin-inline: -4px;
  padding-inline: 4px;
  scroll-padding-inline: 4px;
  scroll-snap-type: x proximity;
  mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent);

  &--fade-start { --fade-start: 24px; }

  &--fade-end { --fade-end: 36px; }

  @include mq(md) {
    justify-content: center;
    flex-wrap: wrap;
    margin-inline: 0;
    padding-inline: 0;
    mask-image: none;
  }

  &__chip {
    flex-shrink: 0;
    border: 0;
    cursor: pointer;
    font-weight: 800;
    font-size: 13px;
    white-space: nowrap;
    @include pill(7px, 13px);
    scroll-snap-align: start;
    background: var(--surface);
    color: var(--ink);
    box-shadow: $shadow-flat;

    @each $s in $species {
      &--#{$s} { background: var(--t-#{$s}); }
    }

    &.is-active { background: var(--ink); color: var(--bg); box-shadow: none; }
  }
}
</style>
