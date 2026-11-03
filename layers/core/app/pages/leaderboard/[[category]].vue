<script setup lang="ts">
import {
  HAS_BREED_CITY, NEW_TALENT_DAYS, PERIODS, SPECIES_EMOJI, TOP_RANK, rankingPath, speciesFromSlug,
  type Leaderboard, type Period, type RankedPet, type Species,
} from '#shared/models'

const route = useRoute()
const { features } = useAppConfig()
const { user } = useUserSession()
const { t } = useI18n()

const species = computed(() => speciesFromSlug(route.params.category))
if (route.params.category && !species.value) {
  throw createError({ statusCode: 404, statusMessage: t('ranking.notFound'), fatal: true })
}
const period = computed<Period>(() => PERIODS.find(p => p === route.query.period) ?? 'week')

// Specie nel percorso (/leaderboard/gatti), periodo nella query: link facili da condividere
const speciesModel = computed({
  get: () => species.value,
  set: (s: Species | undefined) => navigateTo({ path: rankingPath(s), query: route.query }),
})
// Città nella query (?city=Torino): con la specie fa "Top 5 cani a Torino". Solo sui siti che chiedono la città
const city = computed(() => (HAS_BREED_CITY && typeof route.query.city === 'string' && route.query.city.trim()) || undefined)
const cityQuery = computed(() => (city.value ? { city: city.value } : {}))
const periodLink = (p: Period) => ({ path: route.path, query: { ...cityQuery.value, ...(p === 'week' ? {} : { period: p }) } })
const setCity = (c: string) => navigateTo({ path: route.path, query: { ...route.query, city: c || undefined } })
const { data: cityList } = useLazyFetch('/api/leaderboard/cities', { server: false, immediate: HAS_BREED_CITY })

const { data, status } = await useFetch<Leaderboard>('/api/leaderboard', {
  query: { species, period, city },
})

const baseTitle = computed(() => species.value ? t('ranking.species', { species: speciesText(species.value, 'many', t) }) : t('ranking.general'))
const title = computed(() => (city.value ? t('ranking.cityTitle', { title: baseTitle.value, city: city.value }) : baseTitle.value))
useHead({ title: () => `${title.value}` })

const isRolling = computed(() => period.value === 'week' || period.value === 'month')
const podium = computed(() => {
  const top = data.value?.top ?? []
  return top.length >= 3 ? [top[1]!, top[0]!, top[2]!] : []
})
const rest = computed(() => (podium.value.length ? data.value?.top.slice(3) : data.value?.top) ?? [])

const resets = computed(() => data.value?.resetsAt
  ? new Date(data.value.resetsAt).toLocaleDateString(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' })
  : '')
const periodText = computed(() => (isRolling.value ? t(`ranking.this.${period.value}`) : ''))

// Il punteggio è in cuori: si vede solo per chi è in top (e per i propri pet)
const score = (p: RankedPet) => `♥ ${p.score}`
const detail = (p: RankedPet) => [p.breed || speciesText(p.species, 'one', t), p.city].filter(Boolean).join(' · ')
const isMine = (p: RankedPet) => !!user.value && p.owner === user.value.username
// Il proprio pet meglio piazzato tra quelli in vetrina (generale o della sua specie)
const celebrate = computed(() => {
  const shown = [...(data.value?.top ?? []), ...(data.value?.bySpecies.flatMap(g => g.top) ?? [])].filter(isMine)
  const place = (p: RankedPet) => (species.value ? p.rank : p.speciesRank ?? p.rank)
  const best = shown.sort((a, b) => place(a) - place(b))[0]
  return best && { pet: best, place: place(best) }
})
const speciesLink = (s: Species) => ({ path: rankingPath(s), query: route.query })
const toTop = (p: RankedPet & { toTop: number }) =>
  t('ranking.toTop', {
    n: p.toTop, top: TOP_RANK,
    among: [speciesText(p.species, 'among', t), city.value ? t('ranking.inCity', { city: city.value }) : ''].filter(Boolean).join(' '),
  }, p.toTop)
</script>

<template>
  <section class="ranking">
    <header class="ranking__header">
      <h1 class="ranking__title">{{ title }}</h1>
      <SpeciesChips v-model="speciesModel" />
      <div v-if="cityList?.cities.length || city" class="ranking__cities">
        <label class="ranking__city">
          <span aria-hidden="true">📍</span>
          <span class="u-visually-hidden">{{ $t('ranking.city') }}</span>
          <select :value="city ?? ''" class="ranking__city-select" @change="setCity(($event.target as HTMLSelectElement).value)">
            <option value="">{{ $t('ranking.allCities') }}</option>
            <option v-if="city && !cityList?.cities.some(c => c.name.toLowerCase() === city!.toLowerCase())" :value="city">{{ city }}</option>
            <option v-for="c in cityList?.cities" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
        </label>
        <button v-if="cityList?.here && cityList.here !== city" type="button" class="ranking__near" @click="setCity(cityList.here)">
          {{ $t('ranking.nearYou', { city: cityList.here }) }}
        </button>
      </div>
      <nav class="ranking__periods" :aria-label="$t('ranking.period')">
        <NuxtLink
          v-for="p in PERIODS" :key="p" :to="periodLink(p)"
          class="ranking__period" :class="{ 'is-active': period === p }" :aria-current="period === p ? 'page' : undefined"
        >
          {{ $t(`ranking.periods.${p}`) }}
        </NuxtLink>
      </nav>
      <p class="ranking__note">
        <template v-if="isRolling">{{ $t('ranking.rollingNote', { period: periodText, date: resets }) }}</template>
        <template v-else-if="period === 'new'">{{ $t('ranking.newNote', { n: NEW_TALENT_DAYS }) }}</template>
        <template v-else>{{ $t('ranking.totalNote') }}</template>
      </p>
    </header>
    <NuxtLink v-if="features.shelters" to="/shelters" class="ranking__adopt">🏠 <b>{{ $t('shelters.title') }}</b>: {{ $t('ranking.adoptLink') }} →</NuxtLink>

    <div v-if="celebrate" class="ranking__celebrate">
      <span class="ranking__party" aria-hidden="true">🎉</span>
      <p class="ranking__celebrate-text">
        {{ $t('ranking.celebrate', {
          name: celebrate.pet.name, place: celebrate.place,
          among: [speciesText(celebrate.pet.species, 'among'), city ? $t('ranking.inCity', { city }) : ''].filter(Boolean).join(' '),
        }) }}
      </p>
      <ShareCard :pet-id="celebrate.pet.id" :pet-name="celebrate.pet.name" :label="$t('ranking.celebrateShare')" />
    </div>

    <div class="ranking__results" :class="{ 'is-loading': status === 'pending' }">
      <ol v-if="podium.length" class="ranking__podium">
        <li v-for="p in podium" :key="p.id" class="ranking__place" :class="[`ranking__place--${p.rank}`, { 'is-mine': isMine(p) }]">
          <NuxtLink :to="entryUrl(p.id)" class="ranking__place-link">
            <span class="ranking__photo">
              <PetEars :species="p.species" />
              <picture><source v-for="s in photoSources(p.image, 'v', '(min-width: 760px) 300px, 34vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="p.image" :alt="p.name" class="ranking__img"></picture>
              <PetRosette :place="p.rank" class="ranking__medal" />
            </span>
            <b class="ranking__name">{{ p.name }}</b>
            <span class="ranking__score">{{ score(p) }}</span>
            <span class="ranking__step" aria-hidden="true">{{ p.rank }}</span>
          </NuxtLink>
        </li>
      </ol>

      <ol v-if="rest.length" class="ranking__list" :start="podium.length ? 4 : 1">
        <li v-for="p in rest" :key="p.id" class="ranking__row" :class="{ 'is-mine': isMine(p) }">
          <PetRankRow :pet="p" :score="score(p)" :detail="detail(p)" :mine="isMine(p)" :show-species="!species" />
        </li>
      </ol>

      <div v-if="!data?.top.length" class="ranking__empty">
        <p>
          <template v-if="isRolling">
            {{ $t('ranking.noDuels', { period: periodText }) }}
            {{ species ? speciesText(species, 'among') : '' }} {{ species ? SPECIES_EMOJI[species] : '' }}
          </template>
          <template v-else>{{ $t('ranking.empty') }}</template>
        </p>
        <NuxtLink to="/" class="btn btn--primary btn--lg">{{ $t('ranking.goVote') }}</NuxtLink>
      </div>

      <template v-if="data?.bySpecies.length">
        <h2 class="ranking__group-title">{{ $t('ranking.bySpecies', { n: TOP_RANK }) }}</h2>
        <div class="ranking__species-grid">
          <section v-for="g in data.bySpecies" :key="g.species" class="ranking__species">
            <h3 class="ranking__species-title">
              <NuxtLink :to="speciesLink(g.species)" class="ranking__species-link">{{ SPECIES_EMOJI[g.species] }} {{ speciesText(g.species, 'many') }} <span class="ranking__arrow">→</span></NuxtLink>
            </h3>
            <ol class="ranking__list">
              <li v-for="p in g.top" :key="p.id" class="ranking__row" :class="{ 'is-mine': isMine(p) }">
                <PetRankRow :pet="p" :score="score(p)" :detail="detail(p)" :mine="isMine(p)" :rank-label="p.speciesRank" />
              </li>
            </ol>
          </section>
        </div>
      </template>

      <template v-if="data?.mine.length">
        <h2 class="ranking__mine-title">{{ $t('ranking.yourPets') }}</h2>
        <p class="ranking__note ranking__note--mine">{{ $t('ranking.yourPetsNote', { n: TOP_RANK }) }}</p>
        <ol class="ranking__list">
          <li v-for="p in data.mine" :key="p.id" class="ranking__row is-mine">
            <PetRankRow :pet="p" :score="score(p)" :detail="toTop(p)" mine :show-species="!species" rank-label="🎯" />
          </li>
        </ol>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use "sass:list";

// Gradini del podio: altezza, colore, dimensione del numero
$steps: (
  1: (56px, var(--sun), 26px),
  2: (38px, #d9dee6, 20px),
  3: (24px, #eab98f, 16px),
);

// Pagina: classifica per specie, città e periodo, con podio
.ranking {
  @include stack($space-6);
  padding-bottom: 12px;

  &__header { @include stack($space-4); }

  &__title { font-size: 24px; }

  &__periods { display: flex; background: var(--surface); border-radius: $radius-pill; padding: $space-1; align-self: flex-start; box-shadow: $shadow-flat; }

  &__period {
    @include pill(7px, 15px);
    font-weight: 800;
    font-size: 14px;
    @include plain-link(var(--muted));

    &.is-active { background: var(--sun); color: var(--sun-ink); }
  }

  &__note {
    margin: 0;
    color: var(--muted);
    font-size: 13px;

    &--mine { margin-bottom: $space-3; }
  }

  &__celebrate {
    display: flex;
    align-items: center;
    gap: $space-5;
    flex-wrap: wrap;
    padding: 12px 14px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--sun) 30%, var(--surface));
    box-shadow: $shadow-flat;
  }

  &__celebrate-text { margin: 0; flex: 1 1 200px; min-width: 0; font-weight: 800; }

  &__party { font-size: 26px; }

  &__cities { @include cluster($space-3); align-items: center; }

  &__city {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    background: var(--surface);
    border-radius: $radius-pill;
    padding: 4px 6px 4px 12px;
    box-shadow: $shadow-flat;
    max-width: 100%;
  }

  &__city-select { border: 0; background: transparent; color: var(--ink); font: inherit; font-weight: 800; font-size: 14px; padding: 5px 4px; max-width: 60vw; cursor: pointer; }

  &__near { border: 0; @include pill(8px, 14px); font-weight: 800; font-size: 13px; cursor: pointer; background: var(--coral-soft); color: var(--coral-deep); }

  &__results.is-loading { opacity: .5; transition: opacity .2s; }

  // Podio: il primo più grande e più in alto, secondo e terzo più piccoli, ognuno sul suo gradino
  &__podium {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1.25fr 1fr;
    gap: $space-2;
    align-items: end;

    @include mq(md) { max-width: 560px; margin-inline: auto; }
  }

  &__place-link { display: flex; flex-direction: column; align-items: center; gap: $space-1; @include plain-link(var(--ink)); text-align: center; }

  &__photo {
    --ear: 24px;
    position: relative;
    width: 100%;
    background: var(--surface);
    padding: 5px;
    border-radius: 20px;
    box-shadow: 0 10px 20px -12px var(--shadow);

    .ranking__place--1 & { --ear: 32px; box-shadow: 0 0 0 4px var(--sun), 0 12px 24px -10px var(--shadow); }

    .ranking__place--2 & { width: 86%; transform: rotate(-2deg); }

    .ranking__place--3 & { width: 76%; transform: rotate(2deg); }

    .ranking__place.is-mine & { outline: 3px solid var(--coral); outline-offset: 3px; }
  }

  &__img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 15px; }

  &__medal {
    position: absolute;
    right: -8px;
    bottom: -12px;
    z-index: 4;

    .ranking__place--1 & { width: 46px; height: 60px; bottom: -18px; right: -12px; }
  }

  &__step {
    align-self: stretch;
    margin-top: $space-1;
    border-radius: 12px 12px 0 0;
    display: grid;
    place-items: center;
    font-family: var(--display);
    font-weight: 600;
    color: #3d2416;

    @each $place, $s in $steps {
      .ranking__place--#{$place} & { height: list.nth($s, 1); background: list.nth($s, 2); font-size: list.nth($s, 3); }
    }
  }

  &__name { font-family: var(--display); font-weight: 600; font-size: 16px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__score { font-weight: 800; color: var(--coral); font-variant-numeric: tabular-nums; }

  &__list { list-style: none; margin: 0; padding: 0; @include stack($space-2); }

  &__row {
    background: var(--surface);
    border-radius: $radius-md;
    box-shadow: $shadow-flat;

    &.is-mine { box-shadow: inset 0 0 0 2px var(--coral); }
  }

  &__mine-title { font-size: 17px; margin-top: 16px; margin-bottom: $space-1; }

  &__group-title { font-size: 19px; margin: 18px 0 10px; }

  &__species-grid {
    display: grid;
    gap: $space-6;

    @include mq(md) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  &__species { @include stack($space-3); min-width: 0; }

  &__species-title { font-size: 16px; }

  &__species-link { @include plain-link(var(--ink)); }

  &__arrow { color: var(--coral); }

  &__empty { text-align: center; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: $space-4; padding: 30px 0; }

  &__adopt { display: block; padding: 12px 16px; border-radius: $radius-md; background: var(--coral-soft); @include plain-link(var(--ink)); font-size: 14px; font-weight: 700; }
}
</style>
