<script setup lang="ts">
import type { Species } from '#shared/models'

const species = ref<Species>()
const { current, votes, toast, hint, failed, result, celebrate, ad, dismissAd, load, reset, vote, skip } = useDuelQueue(() => ({
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
    </div>
    <SpeciesChips v-model="species" />
    <!-- I voti dati stanno nella barra in alto, accanto alla campanella: qui ogni pixel va alle foto -->
    <ClientOnly>
      <Teleport to="#header-extra">
        <NuxtLink to="/voted" class="home__count" :title="$t('duel.votedTimes', { n: votes })">♥ {{ votes }}</NuxtLink>
      </Teleport>
    </ClientOnly>

    <DuelPanel :duel="current" :failed="failed" :votes="votes" :hint="hint" :toast="toast" :result="result" :celebrate="celebrate" :ad="ad" @vote="vote" @skip="skip" @retry="load" @ad-continue="dismissAd">
      <template #empty>
        <p>{{ $t('duel.allVoted') }} 🎉</p>
        <NuxtLink to="/upload">{{ $t('duel.uploadYours') }}</NuxtLink>
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
  &__head {
    display: flex;
    align-items: flex-end;

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

  // Nella barra in alto (Teleport): gli stili scoped seguono l'elemento anche lì
  &__count {
    font-weight: 900;
    font-size: 13px;
    @include pill(6px, 12px);
    background: var(--heart-soft);
    color: var(--heart);
    font-variant-numeric: tabular-nums;
    // Porta a "Votati da te"
    text-decoration: none;
    flex-shrink: 0;
  }
}
</style>
