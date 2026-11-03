<script setup lang="ts">
import type { ChallengeSummary } from '#shared/models'

const props = defineProps<{ challenge: ChallengeSummary, big?: boolean }>()

// Sfida in corso in evidenza: conto alla rovescia vivo. Parte solo nel browser, così il server
// e il primo disegno mostrano lo stesso testo
const now = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (!props.big || props.challenge.status !== 'active') return
  now.value = Date.now()
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const { t } = useI18n()
const text = computed(() => challengeText(props.challenge))
const when = computed(() => {
  const c = props.challenge
  if (c.status === 'active' && now.value !== null) return t('challenge.endsIn', { time: countdown(c.endsAt, now.value) })
  if (c.status === 'active') return t('challenge.ends', { time: timeUntil(c.endsAt) })
  if (c.status === 'upcoming') return t('challenge.starts', { date: shortDate(c.startsAt, true) })
  return `${shortDate(c.startsAt)} – ${shortDate(new Date(new Date(c.endsAt).getTime() - 1).toISOString())}`
})
</script>

<template>
  <NuxtLink :to="`/challenges/${challenge.slug}`" class="challenge-card" :class="[`challenge-card--${challenge.status}`, { 'challenge-card--big': big }]">
    <div class="challenge-card__top">
      <span class="challenge-card__emoji" aria-hidden="true">{{ challenge.emoji }}</span>
      <div class="challenge-card__text">
        <h3 class="challenge-card__title">{{ text.title }}</h3>
        <p v-if="big" class="challenge-card__desc">{{ text.description }}</p>
        <p class="challenge-card__meta">
          <span v-if="challenge.adoptionOnly" class="challenge-card__tag">🏠 {{ $t('challenge.adoptionTag') }}</span>
          <span v-if="challenge.species" class="challenge-card__tag">{{ $t('challenge.onlySpecies', { species: speciesText(challenge.species, 'many') }) }}</span>
          {{ when }}
          <template v-if="challenge.status !== 'upcoming'"> · {{ $t('challenge.entries', { n: challenge.entries }) }}</template>
        </p>
      </div>
    </div>
    <div v-if="challenge.winner" class="challenge-card__winner">
      <picture><source v-for="s in photoSources(challenge.winner.image, 's', '44px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="challenge.winner.image" :alt="challenge.winner.name" loading="lazy"></picture>
      <span>🏆 <b>{{ challenge.winner.name }}</b> · @{{ challenge.winner.owner }}</span>
    </div>
    <div v-if="big && challenge.leaders.length" class="challenge-card__leaders">
      <span class="challenge-card__faces">
        <picture v-for="l in challenge.leaders" :key="l.petId"><source v-for="s in photoSources(l.image, 's', '36px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="l.image" :alt="l.name"></picture>
      </span>
      <span class="challenge-card__leading">{{ $t('challenge.leading') }} <b>{{ challenge.leaders[0]!.name }}</b><template v-if="challenge.leaders.length > 1">, {{ challenge.leaders.slice(1).map(l => l.name).join(', ') }}</template></span>
    </div>
    <div v-if="big && challenge.status === 'active'" class="challenge-card__cta">
      <span class="challenge-card__button challenge-card__button--vote">{{ $t('challenge.vote') }}</span>
      <span class="challenge-card__button challenge-card__button--join">{{ $t('challenge.join') }}</span>
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
// Molecola: anteprima di una sfida; "big" è quella in evidenza, gialla e cucita
.challenge-card {
  @include stack($space-4);
  padding: $space-6;
  border-radius: $radius-lg;
  background: var(--surface);
  @include plain-link(var(--ink));
  box-shadow: 0 8px 20px -14px var(--shadow);

  &__top { display: flex; gap: $space-5; align-items: flex-start; }

  &__emoji {
    font-size: 30px;
    line-height: 1;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    background: var(--bg);
    border-radius: 50%;
  }

  &__text { min-width: 0; }

  &__title { font-size: 18px; }

  &__desc { margin: 4px 0 0; color: var(--ink); }

  &__meta { margin: 4px 0 0; color: var(--muted); font-size: 13px; }

  &__tag { display: inline-block; background: var(--coral-soft); color: var(--coral-deep); font-weight: 800; font-size: 11px; @include pill(2px, 8px); margin-right: 4px; }

  &__winner {
    display: flex;
    align-items: center;
    gap: $space-4;
    font-size: 14px;

    img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 3px solid var(--sun); }
  }

  &__leaders { display: flex; align-items: center; gap: $space-4; font-size: 14px; min-width: 0; }

  &__leading { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__faces {
    display: flex;
    flex-shrink: 0;

    img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; background: var(--surface); }

    picture:not(:first-child) img { margin-left: -12px; }

    picture:first-child img { position: relative; z-index: 1; width: 40px; height: 40px; }
  }

  &__cta { display: flex; gap: $space-3; }

  &__button {
    flex: 1;
    text-align: center;
    padding: 12px;
    border-radius: $radius-pill;
    font-weight: 900;

    &--vote { background: var(--action); color: #fff; }

    &--join { background: var(--sun-ink); color: var(--sun); }
  }

  &--big {
    padding: $space-7;
    background: var(--sun);
    color: var(--sun-ink);
    outline: 2px dashed rgba(61, 36, 22, .25);
    outline-offset: -7px;

    .challenge-card__meta { color: var(--sun-ink); opacity: .75; font-variant-numeric: tabular-nums; }

    .challenge-card__desc { color: var(--sun-ink); }

    .challenge-card__tag { background: var(--sun-ink); color: var(--sun); }

    .challenge-card__emoji { font-size: 40px; width: 68px; height: 68px; background: rgba(255, 255, 255, .55); }

    .challenge-card__title { font-size: 24px; }
  }
}
</style>
