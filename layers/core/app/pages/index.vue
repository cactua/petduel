<script setup lang="ts">
import type { Species } from '#shared/models'

const species = ref<Species>()
const { current, votes, toast, hint, failed, result, celebrate, ad, dismissAd, load, reset, vote } = useDuelQueue(() => ({
  duelUrl: '/api/duel',
  voteUrl: '/api/vote',
  query: { species: species.value },
}))

watch(species, reset)
onMounted(load)
</script>

<template>
  <section class="home u-fit-screen">
    <ChallengeBanner />
    <div class="home__head">
      <div class="home__ask">
        <SiteMascot class="home__mascot" />
        <h1 class="home__question">{{ $t('duel.question') }}</h1>
      </div>
      <span class="home__count" :title="$t('duel.votedTimes', { n: votes })">♥ {{ votes }}</span>
    </div>
    <div class="home__filters">
      <SpeciesChips v-model="species" class="home__chips" />
      <span class="home__count home__count--inline" :title="$t('duel.votedTimes', { n: votes })">♥ {{ votes }}</span>
    </div>

    <DuelPanel :duel="current" :failed="failed" :votes="votes" :hint="hint" :toast="toast" :result="result" :celebrate="celebrate" :ad="ad" @vote="vote" @retry="load" @ad-continue="dismissAd">
      <template #empty>
        <p>{{ $t('duel.allVoted') }} 🎉</p>
        <NuxtLink to="/carica">{{ $t('duel.uploadYours') }}</NuxtLink>
      </template>
    </DuelPanel>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: duello della home
.home {
  flex: 1;
  @include stack($space-4);

  // Su telefono ogni pixel in altezza va alle foto: la domanda resta solo per i lettori di schermo
  // e il contatore dei voti passa accanto ai filtri
  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-5;

    @include mq-down(md) { @include visually-hidden; }
  }

  // La mascotte fa la domanda dentro un fumetto (se il sito non ne ha, resta il fumetto senza punta)
  &__ask { display: flex; align-items: flex-end; gap: $space-1; min-width: 0; }

  &__mascot {
    width: 54px;
    height: 49px;

    @include mq(md) { width: 72px; height: 65px; }
  }

  &__question {
    margin-bottom: 10px;
    font-size: 19px;
    font-weight: 600;
    background: var(--surface);
    padding: 7px 14px;
    border-radius: 20px 20px 20px 4px;
    box-shadow: 0 8px 18px -12px var(--shadow);

    @include mq(md) { font-size: 24px; margin-bottom: 14px; }

    &:first-child { border-radius: 20px; }
  }

  &__count {
    margin-bottom: 12px;
    font-weight: 900;
    font-size: 13px;
    @include pill(6px, 12px);
    background: var(--heart-soft);
    color: var(--heart);
    font-variant-numeric: tabular-nums;

    &--inline {
      margin: 0;
      flex-shrink: 0;

      @include mq(md) { display: none; }
    }
  }

  &__filters { display: flex; align-items: center; gap: $space-3; min-width: 0; }

  &__chips { flex: 1; min-width: 0; }
}
</style>
