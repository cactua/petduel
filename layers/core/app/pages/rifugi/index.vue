<script setup lang="ts">
import { shelterImageSources } from '#shared/images'
import type { AdoptablePet, PublicShelter, Species } from '#shared/models'

const { t } = useI18n()
useHead({ title: () => `${t('shelters.title')} · PetDuel` })
useSeoMeta({ description: () => t('shelters.seo') })

const route = useRoute()
const species = ref<Species>()
// La città resta nell'indirizzo, così "Cerca casa a Torino" si può condividere
const city = ref(typeof route.query.citta === 'string' ? route.query.citta : '')
watch(city, c => navigateTo({ query: c ? { citta: c } : {} }, { replace: true }))

const { data, pending } = await useFetch<{ pets: AdoptablePet[], cities: string[] }>('/api/adoptables', {
  query: computed(() => ({ species: species.value, city: city.value || undefined })),
})
const { data: shelters } = await useFetch<PublicShelter[]>('/api/shelters')
const { loggedIn } = useUserSession()
</script>

<template>
  <section class="shelters-page">
    <header class="shelters-page__intro">
      <h1 class="shelters-page__title">{{ $t('shelters.title') }}</h1>
      <p class="shelters-page__lead">{{ $t('shelters.lead') }}</p>
    </header>

    <div class="shelters-page__filters">
      <SpeciesChips v-model="species" />
      <label class="shelters-page__city">
        <span>📍 {{ $t('shelters.near') }}</span>
        <select v-model="city" :aria-label="$t('pet.city')" class="shelters-page__city-select">
          <option value="">{{ $t('shelters.everywhere') }}</option>
          <option v-for="c in data?.cities ?? []" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
    </div>

    <ol v-if="data?.pets.length" class="shelters-page__grid" :class="{ 'is-loading': pending }" :aria-busy="pending">
      <li v-for="p in data.pets" :key="p.id">
        <NuxtLink :to="`/pet/${p.id}`" class="shelters-page__pet">
          <div class="shelters-page__photo">
            <picture><source v-for="s in photoSources(p.image, 'v', '(min-width: 760px) 240px, 46vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="p.image" :alt="$t('shelters.alt', { name: p.name, species: speciesText(p.species, 'one').toLowerCase() })" loading="lazy" class="shelters-page__img"></picture>
            <span class="shelters-page__ribbon" :class="`shelters-page__ribbon--${p.adoption}`">{{ $t(`adoption.status.${p.adoption}`) }}</span>
            <span v-if="p.rank && p.rank <= 3 && !species && !city" class="shelters-page__rank">{{ $t('shelters.mostLoved', { n: p.rank }) }}</span>
          </div>
          <div class="shelters-page__text">
            <b class="shelters-page__name">{{ p.name }}</b>
            <small class="shelters-page__meta">{{ [p.breed || speciesText(p.species, 'one'), p.city].filter(Boolean).join(' · ') }}</small>
            <small class="shelters-page__meta shelters-page__meta--shelter">{{ p.shelter.name }}</small>
          </div>
        </NuxtLink>
      </li>
    </ol>
    <div v-else-if="data" class="shelters-page__empty">
      <PetMascot class="shelters-page__mascot" />
      <p class="shelters-page__empty-text">{{ city || species ? $t('shelters.noneFiltered') : $t('shelters.none') }}</p>
    </div>

    <h2 v-if="shelters?.length" class="shelters-page__heading">{{ $t('shelters.verified') }}</h2>
    <div v-if="shelters?.length" class="shelters-page__list">
      <NuxtLink v-for="s in shelters" :key="s.slug" :to="`/rifugi/${s.slug}`" class="shelters-page__shelter" :style="accentStyle(s.accent)">
        <span class="shelters-page__logo">
          <img v-if="s.logo" :src="shelterImageSources(s.logo, 'logo').src" alt="" loading="lazy" class="shelters-page__logo-img">
          <template v-else>{{ s.name.slice(0, 1) }}</template>
        </span>
        <span class="shelters-page__who">
          <b>{{ s.name }}</b>
          <small class="shelters-page__who-meta">{{ s.city }} · {{ $t('shelters.available', { n: s.available }) }}<template v-if="s.adopted"> · {{ $t('shelters.adopted', { n: s.adopted }) }}</template></small>
        </span>
      </NuxtLink>
    </div>

    <aside class="shelters-page__join">
      <div class="shelters-page__join-text">
        <b>{{ $t('shelters.joinTitle') }}</b>
        <p class="shelters-page__join-lead">{{ $t('shelters.joinText') }}</p>
      </div>
      <NuxtLink :to="loggedIn ? '/rifugio' : { path: '/registrati', query: { redirect: '/rifugio' } }" class="btn btn--primary btn--lg">{{ $t('shelters.joinCta') }}</NuxtLink>
    </aside>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: pet in adozione e rifugi verificati
.shelters-page {
  @include stack($space-6);
  padding-bottom: 12px;

  &__title { font-size: 30px; }

  &__lead { margin: $space-2 0 0; color: var(--muted); max-width: 62ch; line-height: 1.5; }

  &__heading { font-size: 20px; margin-top: $space-3; }

  &__filters {
    @include stack($space-4);

    @include mq(md) { flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  }

  &__city { display: flex; flex-shrink: 0; align-items: center; gap: $space-3; font-weight: 800; font-size: 14px; white-space: nowrap; }

  &__city-select { flex: 0 1 240px; min-width: 0; padding: 8px 12px; border-radius: $radius-pill; border: 2px solid var(--line); background: var(--surface); color: var(--ink); }

  &__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(46%, 200px), 1fr));
    gap: $space-5;

    &.is-loading { opacity: .6; }
  }

  &__pet {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--surface);
    border-radius: 24px;
    padding: 6px;
    @include plain-link(var(--ink));
    box-shadow: 0 10px 22px -16px var(--glow);
  }

  &__photo { position: relative; }

  &__img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 19px; background: var(--line); }

  &__ribbon {
    position: absolute;
    left: 8px;
    top: 8px;
    background: var(--action);
    color: #fff;
    font-weight: 900;
    font-size: 12px;
    @include pill(4px, 10px);
    box-shadow: 0 4px 10px -4px rgba(0, 0, 0, .4);

    &--fostered { background: var(--sun); color: var(--sun-ink); }
  }

  &__rank { position: absolute; right: 8px; bottom: 8px; background: var(--surface); color: var(--ink); font-weight: 900; font-size: 11px; @include pill(3px, 9px); }

  &__text { display: flex; flex-direction: column; padding: 8px 8px 6px; min-width: 0; }

  &__name { font-family: var(--display); font-weight: 600; font-size: 19px; }

  &__meta {
    color: var(--muted);
    font-weight: 700;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--shelter { color: var(--ink); }
  }

  &__empty { @include stack($space-3); align-items: center; padding: 26px; text-align: center; color: var(--muted); background: var(--surface); border-radius: $radius-xl; }

  &__mascot { width: 84px; height: 76px; }

  &__empty-text { margin: 0; }

  &__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: $space-3; }

  &__shelter {
    display: flex;
    align-items: center;
    gap: $space-5;
    padding: 10px 14px 10px 10px;
    border-radius: $radius-md;
    background: var(--surface);
    @include plain-link(var(--ink));
    box-shadow: $shadow-flat;
    border-left: 5px solid var(--accent);
  }

  &__logo {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--display);
    font-weight: 700;
    font-size: 22px;
  }

  &__logo-img { width: 100%; height: 100%; object-fit: cover; }

  &__who { @include stack(2px); min-width: 0; }

  &__who-meta { color: var(--muted); font-weight: 700; }

  &__join {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-5;
    justify-content: space-between;
    margin-top: $space-3;
    padding: 18px;
    border-radius: 24px;
    background: var(--coral-soft);
  }

  &__join-text { flex: 1 1 320px; min-width: 0; }

  &__join-lead { margin: $space-1 0 0; font-size: 14px; max-width: 65ch; }
}
</style>
