<script setup lang="ts">
import type { ChallengeDetail } from '#shared/models'

const TABS = [
  { key: 'vota', label: 'challenge.vote' },
  { key: 'classifica', label: 'nav.ranking' },
  { key: 'partecipa', label: 'challenge.join' },
] as const
type Tab = (typeof TABS)[number]['key']

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { data: challenge, error, refresh } = await useFetch<ChallengeDetail>(() => `/api/challenges/${slug.value}`)

const { t } = useI18n()
const text = computed(() => (challenge.value ? challengeText(challenge.value) : { title: '', description: '' }))
useHead({ title: () => (challenge.value ? `${text.value.title} · PetDuel` : `${t('nav.challenges')} · PetDuel`) })

const isActive = computed(() => challenge.value?.status === 'active')
const tab = computed<Tab>(() => {
  if (!isActive.value) return 'classifica'
  return TABS.find(t => t.key === route.query.tab)?.key ?? 'vota'
})
const tabLink = (t: Tab) => ({ path: route.path, query: t === 'vota' ? {} : { tab: t } })

const { current, votes, toast, hint, failed, result, celebrate, ad, dismissAd, load, vote } = useDuelQueue(() => ({
  duelUrl: `/api/challenges/${slug.value}/duel`,
  voteUrl: `/api/challenges/${slug.value}/vote`,
  challenge: true,
}))
// Il duello parte solo quando si apre la scheda Vota
watch(tab, (t) => {
  if (t === 'vota' && isActive.value && !current.value) load()
})
onMounted(() => {
  if (tab.value === 'vota' && isActive.value && !current.value) load()
})

const when = computed(() => {
  const c = challenge.value
  if (!c) return ''
  if (c.status === 'active') return t('challenge.ends', { time: timeUntil(c.endsAt) })
  if (c.status === 'upcoming') return t('challenge.starts', { date: shortDate(c.startsAt, true) })
  return t('challenge.ended')
})
const winner = computed(() => challenge.value?.status === 'ended' ? challenge.value.standings[0] : undefined)
</script>

<template>
  <section class="challenge-page" :class="{ 'challenge-page--vote u-fit-screen': tab === 'vota' }">
    <p v-if="error" class="challenge-page__empty">{{ $t('challenge.notFound') }} <NuxtLink to="/sfide">{{ $t('challenge.seeAll') }}</NuxtLink></p>
    <template v-else-if="challenge">
      <header class="challenge-page__header">
        <NuxtLink to="/sfide" class="challenge-page__back">← {{ $t('nav.challenges') }}</NuxtLink>
        <div class="challenge-page__title">
          <span class="challenge-page__emoji" aria-hidden="true">{{ challenge.emoji }}</span>
          <div>
            <h1 class="challenge-page__name">{{ text.title }}</h1>
            <p class="challenge-page__meta">
              <span v-if="challenge.species" class="challenge-page__tag">{{ $t('challenge.onlySpecies', { species: speciesText(challenge.species, 'many') }) }}</span>
              {{ when }} · {{ $t('challenge.entries', { n: challenge.entries }) }}
            </p>
          </div>
        </div>
        <p v-if="tab !== 'vota'" class="challenge-page__desc">{{ text.description }}</p>
        <nav v-if="isActive" class="challenge-page__tabs" :aria-label="$t('challenge.sections')">
          <NuxtLink
            v-for="item in TABS" :key="item.key" :to="tabLink(item.key)"
            class="challenge-page__tab" :class="{ 'is-active': tab === item.key }" :aria-current="tab === item.key ? 'page' : undefined"
          >
            {{ $t(item.label) }}
          </NuxtLink>
        </nav>
      </header>

      <DuelPanel
        v-if="tab === 'vota'"
        :duel="current" :failed="failed" :votes="votes" :hint="hint" :toast="toast" :result="result" :celebrate="celebrate" :ad="ad"
        @vote="vote" @retry="load" @ad-continue="dismissAd"
      >
        <template #empty>
          <p v-if="challenge.entries < 2">{{ $t('challenge.needTwo') }}</p>
          <p v-else>{{ $t('challenge.allVoted') }}</p>
          <NuxtLink :to="tabLink('partecipa')">{{ $t('challenge.enterYours') }}</NuxtLink>
        </template>
      </DuelPanel>

      <div v-else-if="tab === 'classifica'" class="challenge-page__scroll">
        <div v-if="winner" class="challenge-page__winner">
          <picture><source v-for="s in photoSources(winner.image, 'v', '90px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="winner.image" :alt="winner.name" class="challenge-page__winner-img"></picture>
          <div>
            <small class="challenge-page__winner-label">{{ $t('challenge.winner') }}</small>
            <h2 class="challenge-page__winner-name">🏆 {{ winner.name }}</h2>
            <p class="challenge-page__winner-meta"><NuxtLink :to="`/u/${winner.owner}`" class="challenge-page__winner-link">@{{ winner.owner }}</NuxtLink> · ♥ {{ winner.score }}</p>
          </div>
        </div>
        <p v-if="challenge.status === 'upcoming'" class="challenge-page__empty">{{ $t('challenge.notStarted', { date: shortDate(challenge.startsAt, true) }) }}</p>
        <ol v-else-if="challenge.standings.length" class="challenge-page__list">
          <li v-for="p in challenge.standings" :key="p.entryId" class="challenge-page__row">
            <PetRankRow :pet="p" :score="`♥ ${p.score}`" :detail="[p.breed || speciesText(p.species, 'one'), p.city].filter(Boolean).join(' · ')" :show-species="!challenge.species" />
          </li>
        </ol>
        <p v-else class="challenge-page__empty">{{ $t('challenge.noEntries') }}</p>
      </div>

      <div v-else class="challenge-page__scroll">
        <ChallengeJoin :challenge="challenge" @joined="refresh()" />
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: una sfida, con le schede Vota / Classifica / Partecipa
.challenge-page {
  @include stack($space-4);
  padding-bottom: 12px;

  &--vote { flex: 1; padding-bottom: 0; }

  &__header { @include stack($space-3); }

  &__back { @include plain-link(var(--muted)); font-weight: 700; font-size: 14px; }

  &__title { display: flex; gap: $space-4; align-items: center; }

  &__emoji { font-size: 38px; line-height: 1; }

  &__name { font-size: 22px; }

  &__meta { margin: 2px 0 0; color: var(--muted); font-size: 13px; }

  &__tag { display: inline-block; background: var(--coral-soft); color: var(--coral); font-weight: 800; font-size: 11px; @include pill(2px, 8px); margin-right: $space-1; }

  &__desc { margin: 0; }

  &__tabs { display: flex; background: var(--surface); border-radius: $radius-pill; padding: $space-1; box-shadow: $shadow-flat; }

  &__tab {
    flex: 1;
    text-align: center;
    padding: $space-3;
    border-radius: $radius-pill;
    font-weight: 800;
    font-size: 14px;
    @include plain-link(var(--muted));

    &.is-active { background: var(--sun); color: var(--sun-ink); }
  }

  &__scroll { @include stack($space-5); padding-bottom: 12px; }

  &__winner { display: flex; gap: $space-6; align-items: center; @include card($space-5, 24px); border: 3px solid var(--sun); }

  &__winner-img { width: 90px; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 16px; transform: rotate(-2deg); }

  &__winner-label { @include eyebrow(11px); font-weight: 800; }

  &__winner-name { font-size: 22px; }

  &__winner-meta { margin: 2px 0 0; color: var(--muted); }

  &__winner-link { color: var(--coral); font-weight: 700; }

  &__list { list-style: none; margin: 0; padding: 0; @include stack($space-2); }

  &__row { background: var(--surface); border-radius: $radius-md; box-shadow: $shadow-flat; }

  &__empty { text-align: center; color: var(--muted); padding: 24px 0; }
}
</style>
