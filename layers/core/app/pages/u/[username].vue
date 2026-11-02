<script setup lang="ts">
import { shelterImageSources } from '#shared/images'
import { HAS_ARTISTS, type AdoptionStatus, type PetGallery as Gallery, type Profile } from '#shared/models'

const { features } = useAppConfig()

const route = useRoute()
const { user } = useUserSession()
const { data: profile, error, refresh } = await useFetch<Profile>(() => `/api/users/${route.params.username}`)

const { t } = useI18n()
useHead({ title: () => (profile.value?.shelter?.name ?? (profile.value ? `@${profile.value.username}` : t('nav.profile'))) })

const since = computed(() => profile.value
  ? new Date(profile.value.memberSince).toLocaleDateString(intlLocale(), { month: 'long', year: 'numeric' })
  : '')
const pending = computed(() => profile.value?.pets.reduce((n, p) => n + p.photos.filter(ph => ph.status === 'pending').length, 0) ?? 0)

const shelter = computed(() => profile.value?.shelter ?? null)
const manage = computed(() => profile.value?.manage ?? null)
const banner = computed(() => (shelter.value?.banner ? shelterImageSources(shelter.value.banner, 'banner') : null))
const logo = computed(() => (shelter.value?.logo ? shelterImageSources(shelter.value.logo, 'logo').src : null))

const pets = computed(() => profile.value?.pets ?? [])
const stats = computed(() => [
  { value: pets.value.length, label: shelter.value ? t('profile.statGuests') : t('profile.statPets') },
  { value: profile.value?.votes ?? 0, label: t('profile.statVotes') },
  // I cuori dei propri pet li vede solo il proprietario
  ...(profile.value?.isMe ? [{ value: pets.value.reduce((n, p) => n + (p.wins ?? 0), 0), label: t('profile.statWins') }] : []),
  { value: pets.value.reduce((n, p) => n + p.trophies.length, 0), label: t('profile.statTrophies') },
].filter((s, i) => i < 2 || s.value))

// Pet di un rifugio divisi per stato dell'adozione; gli altri profili restano una lista unica
type Group = AdoptionStatus | 'other'
const GROUPS: Group[] = ['available', 'fostered', 'adopted', 'other']
const groupOf = (p: Gallery): Group => p.adoptionInfo?.status ?? 'other'
const grouped = computed(() => pets.value.some(p => p.adoptionInfo))
const groups = computed(() => GROUPS
  .map(g => ({ id: g, pets: pets.value.filter(p => groupOf(p) === g) }))
  .filter(g => g.pets.length))
const filter = ref<Group | 'all'>('all')
const visibleGroups = computed(() => groups.value.filter(g => filter.value === 'all' || g.id === filter.value))

// Blocca: due tocchi, il secondo conferma. Sbloccare è immediato
const confirmBlock = ref(false)
async function toggleBlock() {
  if (!profile.value) return
  const blocked = !profile.value.blocked
  if (blocked && !confirmBlock.value) {
    confirmBlock.value = true
    return
  }
  confirmBlock.value = false
  await $fetch(`/api/users/${profile.value.username}/block`, { method: 'POST', body: { blocked } })
  await refresh()
}

const thumb = (p: Gallery) => (p.photos.find(ph => ph.status === 'approved') ?? p.photos.find(ph => ph.image))?.image ?? ''
</script>

<template>
  <section class="profile">
    <p v-if="error" class="profile__empty">{{ $t('profile.notFound') }}</p>
    <template v-else-if="profile">
      <!-- Testata: per un rifugio è la sua "vetrina", con nome, logo e colore scelti -->
      <header v-if="shelter" class="profile__card profile__hero profile__hero--shelter" :style="accentStyle(shelter.accent)">
        <div class="profile__banner">
          <picture v-if="banner">
            <source type="image/avif" :srcset="banner.avif" sizes="(min-width: 1000px) 1000px, 100vw">
            <source type="image/webp" :srcset="banner.webp" sizes="(min-width: 1000px) 1000px, 100vw">
            <img :src="banner.src" alt="" class="profile__cover">
          </picture>
        </div>
        <div class="profile__id">
          <span class="profile__avatar profile__avatar--logo">
            <img v-if="logo" :src="logo" alt="" class="profile__cover">
            <template v-else>{{ shelter.name.slice(0, 1) }}</template>
          </span>
          <div class="profile__names">
            <span class="badge badge--ok">✓ {{ $t('shelter.verified') }}</span>
            <h1 class="profile__title">{{ shelter.name }}</h1>
            <p class="profile__sub">@{{ profile.username }} · 📍 {{ shelter.city }}</p>
            <p v-if="shelter.tagline" class="profile__sub profile__sub--tagline">{{ shelter.tagline }}</p>
          </div>
        </div>
        <dl class="profile__stats">
          <div v-for="s in stats" :key="s.label" class="profile__stat"><dt class="profile__stat-label">{{ s.label }}</dt><dd class="profile__stat-value">{{ s.value }}</dd></div>
        </dl>
        <nav class="profile__actions">
          <NuxtLink :to="`/rifugi/${shelter.slug}`" class="btn btn--ghost">🏠 {{ $t('profile.visitShelter') }}</NuxtLink>
          <a v-if="pets.length" href="#pets" class="btn btn--ghost">🐾 {{ $t('profile.seeGuests') }}</a>
        </nav>
        <div v-if="!profile.isMe" class="profile__report">
          <ReportButton :username="profile.username" />
          <button v-if="user" type="button" class="profile__block" @click="toggleBlock">
            {{ profile.blocked ? $t('block.unblock') : confirmBlock ? $t('block.confirm') : $t('block.block') }}
          </button>
        </div>
      </header>

      <header v-else class="profile__card profile__hero">
        <div class="profile__id">
          <span class="profile__avatar" aria-hidden="true">{{ profile.username[0]?.toUpperCase() }}</span>
          <div class="profile__names">
            <span v-if="profile.artist" class="badge badge--soft">🎨 {{ $t('artist.badge') }}</span>
            <h1 class="profile__title">@{{ profile.username }}</h1>
            <p class="profile__sub">{{ $t('profile.since', { date: since }) }}</p>
          </div>
        </div>
        <!-- Pagine social dell'artista: link scritti da lui, quindi niente "follow" -->
        <ul v-if="profile.artist?.links.length" class="profile__links" :aria-label="$t('artist.links')">
          <li v-for="link in profile.artist.links" :key="link">
            <a :href="link" target="_blank" rel="noopener noreferrer nofollow ugc" class="btn btn--ghost profile__link">{{ linkLabel(link) }} ↗</a>
          </li>
        </ul>
        <dl class="profile__stats">
          <div v-for="s in stats" :key="s.label" class="profile__stat"><dt class="profile__stat-label">{{ s.label }}</dt><dd class="profile__stat-value">{{ s.value }}</dd></div>
        </dl>
        <nav v-if="profile.isMe" class="profile__actions">
          <NuxtLink to="/carica" class="btn btn--primary">+ {{ $t('profile.newPet') }}</NuxtLink>
          <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="btn btn--ghost">{{ $t('profile.admin') }}</NuxtLink>
          <NuxtLink v-if="HAS_ARTISTS" to="/account" class="btn btn--ghost">🎨 {{ profile.artist ? $t('artist.edit') : $t('artist.become') }}</NuxtLink>
        </nav>
        <div v-else class="profile__report">
          <ReportButton :username="profile.username" />
          <button v-if="user" type="button" class="profile__block" @click="toggleBlock">
            {{ profile.blocked ? $t('block.unblock') : confirmBlock ? $t('block.confirm') : $t('block.block') }}
          </button>
        </div>
        <p v-if="profile.blocked && !profile.isMe" class="profile__blocked" role="status">🚫 {{ $t('block.active') }}</p>
      </header>

      <!-- Solo per chi gestisce il rifugio: tutto quello che serve, a un tocco -->
      <section v-if="profile.isMe && manage?.status === 'approved'" class="profile__card profile__manage" aria-labelledby="manage-title">
        <h2 id="manage-title" class="profile__manage-title">{{ $t('profile.manageTitle') }}</h2>
        <div class="profile__tiles">
          <NuxtLink to="/rifugio#richieste" class="profile__tile" :class="{ 'profile__tile--hot': manage.newRequests }">
            <span class="profile__tile-icon" aria-hidden="true">📬</span>
            <b class="profile__tile-title">{{ $t('area.requests') }}</b>
            <small class="profile__tile-hint">{{ manage.newRequests ? $t('area.newCount', { n: manage.newRequests }) : $t('profile.noNewRequests') }}</small>
          </NuxtLink>
          <NuxtLink to="/rifugio?modifica=1" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">🎨</span>
            <b class="profile__tile-title">{{ $t('profile.customize') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.customizeHint') }}</small>
          </NuxtLink>
          <NuxtLink to="/carica" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">➕</span>
            <b class="profile__tile-title">{{ $t('profile.addGuest') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.addGuestHint') }}</small>
          </NuxtLink>
          <NuxtLink :to="`/rifugi/${manage.slug}`" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">👀</span>
            <b class="profile__tile-title">{{ $t('profile.publicPage') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.publicPageHint') }}</small>
          </NuxtLink>
        </div>
        <p class="hint">💡 {{ $t('profile.adoptionHint') }}</p>
        <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="profile__admin-link">{{ $t('profile.admin') }} →</NuxtLink>
      </section>

      <NuxtLink v-else-if="profile.isMe && manage?.status === 'pending'" to="/rifugio" class="profile__card profile__status">
        <span class="profile__status-icon" aria-hidden="true">⏳</span>
        <span class="profile__status-text"><b>{{ manage.name }} · {{ $t('area.pending') }}</b><small>{{ $t('profile.pendingShelter') }}</small></span>
      </NuxtLink>
      <NuxtLink v-else-if="profile.isMe && manage?.status === 'rejected'" to="/rifugio" class="profile__card profile__status profile__status--warn">
        <span class="profile__status-icon" aria-hidden="true">✋</span>
        <span class="profile__status-text"><b>{{ manage.name }}</b><small>{{ $t('profile.rejectedShelter') }}</small></span>
      </NuxtLink>

      <p v-if="profile.isMe && pending" class="profile__notice">
        {{ $t('profile.pending', pending) }}
      </p>

      <ArtistWorks v-if="profile.artworks.length" :artworks="profile.artworks" :is-me="profile.isMe" class="profile__card" @changed="refresh()" />

      <template v-if="pets.length">
        <div id="pets" class="profile__bar">
          <h2 class="profile__pets-title">{{ shelter ? $t('profile.guestsTitle', { n: pets.length }) : $t('profile.petsTitle', { n: pets.length }) }}</h2>
          <div v-if="grouped && groups.length > 1" class="profile__filter" role="group" :aria-label="$t('profile.filter')">
            <button type="button" class="chip profile__filter-chip" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ $t('profile.all') }} <span class="profile__filter-count">{{ pets.length }}</span></button>
            <button v-for="g in groups" :key="g.id" type="button" class="chip profile__filter-chip" :aria-pressed="filter === g.id" @click="filter = g.id">
              <i class="profile__dot" :class="`profile__dot--${g.id}`" aria-hidden="true" />{{ $t(`profile.groups.${g.id}`) }} <span class="profile__filter-count">{{ g.pets.length }}</span>
            </button>
          </div>
        </div>

        <nav v-if="pets.length > 1" class="profile__index" :aria-label="$t('profile.jump')">
          <template v-for="g in visibleGroups" :key="g.id">
            <a v-for="p in g.pets" :key="p.id" :href="`#pet-${p.id}`" class="profile__index-link">
              <img v-if="thumb(p)" :src="thumb(p)" alt="" loading="lazy" class="profile__index-thumb">
              <span v-else class="profile__index-thumb profile__index-thumb--empty">{{ p.name[0] }}</span>
              {{ p.name }}
              <i v-if="p.adoptionInfo" class="profile__dot" :class="`profile__dot--${p.adoptionInfo.status}`" :title="$t(`adoption.status.${p.adoptionInfo.status}`)" />
            </a>
          </template>
        </nav>

        <section v-for="g in visibleGroups" :key="g.id" class="profile__group">
          <h3 v-if="grouped && filter === 'all' && groups.length > 1" class="profile__group-title" :class="`profile__group-title--${g.id}`">{{ $t(`profile.groups.${g.id}`) }} <span class="profile__group-count">{{ g.pets.length }}</span></h3>
          <PetGallery
            v-for="pet in g.pets" :id="`pet-${pet.id}`" :key="pet.id" :pet="pet"
            :editable="profile.isMe" link-title class="profile__pet" @changed="refresh()" @deleted="refresh()"
          />
        </section>
      </template>

      <div v-else class="profile__empty">
        <p>{{ profile.isMe ? $t('profile.noPetsMine') : $t('profile.noPets') }}</p>
        <NuxtLink v-if="profile.isMe" to="/carica" class="btn btn--primary btn--lg">{{ $t('profile.uploadFirst') }}</NuxtLink>
      </div>

      <!-- Invito discreto per chi non gestisce ancora un rifugio -->
      <NuxtLink v-if="profile.isMe && !manage && features.shelters" to="/rifugio" class="profile__become">🏠 {{ $t('profile.becomeShelter') }} →</NuxtLink>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Colore del pallino per stato di adozione
$adoption-dots: (
  available: var(--mint),
  fostered: var(--sun-deep),
  adopted: var(--heart),
);

// Pagina: profilo di un utente o di un rifugio
.profile {
  @include stack($space-6);
  padding-bottom: 12px;

  &__card { @include card(18px, $radius-xl); }

  // Testata
  &__hero {
    @include stack(16px);
    overflow: hidden;

    &--shelter { padding-top: 0; }
  }

  &__banner {
    margin: 0 -18px;
    height: clamp(90px, 22vw, 180px);
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--sun)));
  }

  &__cover { width: 100%; height: 100%; object-fit: cover; display: block; }

  &__id {
    display: flex;
    align-items: center;
    gap: $space-6;
    min-width: 0;

    // Solo il logo sale sul banner: il nome resta sotto, sullo sfondo della scheda
    .profile__hero--shelter & {
      align-items: flex-start;

      @include mq-down(sm) { flex-direction: column; gap: $space-3; }
    }
  }

  &__avatar {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--coral);
    color: #fff;
    font-family: var(--display);
    font-size: 30px;
    font-weight: 700;

    &--logo { width: 92px; height: 92px; margin-top: -46px; font-size: 40px; background: var(--accent); color: var(--accent-ink); border: 4px solid var(--surface); }
  }

  &__names {
    min-width: 0;
    @include stack(2px);
    align-items: flex-start;

    .profile__hero--shelter & { padding-top: $space-2; }
  }

  &__title { font-size: 28px; overflow-wrap: anywhere; line-height: 1.1; text-wrap: balance; }

  &__sub {
    margin: 0;
    color: var(--muted);
    font-weight: 700;

    &--tagline { color: var(--ink); }
  }

  &__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: $space-2; margin: 0; }

  &__stat { background: var(--bg); border-radius: 16px; padding: 8px 10px; min-width: 0; display: flex; flex-direction: column-reverse; }

  &__stat-value { margin: 0; font-family: var(--display); font-weight: 700; font-size: 22px; color: var(--coral); font-variant-numeric: tabular-nums; }

  &__stat-label { @include eyebrow; }

  &__actions { @include cluster($space-3); }

  &__links {
    @include cluster($space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link { padding: 6px 12px; font-size: 13px; }

  &__report { align-self: flex-end; display: flex; flex-wrap: wrap; gap: $space-2; color: var(--muted); }

  &__block {
    border: 0;
    padding: 4px 6px;
    background: none;
    color: inherit;
    opacity: .75;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;

    &:hover, &:focus-visible { opacity: 1; text-decoration: underline; }
  }

  &__blocked { margin: 0; color: var(--muted); font-size: 13px; font-weight: 700; }

  // Gestione del rifugio
  &__manage { @include stack($space-5); border: 2px solid var(--coral-soft); }

  &__manage-title { font-size: 20px; }

  &__tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: $space-3; }

  &__tile {
    position: relative;
    @include stack(2px);
    padding: 12px 14px;
    border-radius: $radius-md;
    min-width: 0;
    background: var(--bg);
    @include plain-link(var(--ink));
    border: 2px solid var(--line);

    &:hover { border-color: var(--coral); }

    &--hot { border-color: var(--action); background: var(--coral-soft); }
  }

  &__tile-icon { font-size: 22px; }

  &__tile-title { font-size: 15px; }

  &__tile-hint {
    color: var(--muted);
    font-weight: 700;
    font-size: 12px;

    .profile__tile--hot & { color: var(--coral-deep); font-weight: 900; }
  }

  &__admin-link { @include plain-link(var(--coral-deep)); font-weight: 800; font-size: 14px; }

  &__status {
    display: flex;
    align-items: center;
    gap: $space-5;
    @include plain-link(var(--ink));
    border: 2px solid var(--sun);

    &--warn { border-color: var(--coral); }
  }

  &__status-icon { font-size: 26px; }

  &__status-text {
    @include stack(2px);

    small { color: var(--muted); font-weight: 700; }
  }

  &__notice { margin: 0; padding: 12px 14px; border-radius: $radius-sm; background: var(--coral-soft); color: var(--ink); font-size: 14px; }

  &__bar { scroll-margin-top: 80px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: $space-4; margin-top: $space-2; }

  &__pets-title { font-size: 22px; }

  &__filter { @include cluster($space-2); }

  &__filter-count {
    color: var(--muted);

    [aria-pressed="true"] > & { color: inherit; opacity: .7; }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
    flex: none;

    @each $status, $color in $adoption-dots {
      &--#{$status} { background: $color; }
    }
  }

  // Indice dei pet: una fila che scorre su mobile, a capo su desktop
  &__index {
    display: flex;
    gap: $space-3;
    @include scroll-row;
    margin: 0 -16px;
    padding: 2px 16px 4px;
    scroll-snap-type: x proximity;

    @include mq(md) { flex-wrap: wrap; overflow: visible; margin: 0; padding: 0; }
  }

  &__index-link {
    flex-shrink: 0;
    scroll-snap-align: start;
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    padding: 4px 12px 4px 4px;
    border-radius: $radius-pill;
    background: var(--surface);
    @include plain-link(var(--ink));
    font-weight: 800;
    font-size: 14px;
    box-shadow: $shadow-flat;
  }

  &__index-thumb {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;

    &--empty { display: grid; place-items: center; background: var(--line); font-size: 13px; }
  }

  &__group { @include stack($space-6); }

  &__group-title {
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-top: $space-1;

    &::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--muted); }

    @each $status, $color in $adoption-dots {
      &--#{$status}::before { background: $color; }
    }
  }

  &__group-count { color: var(--muted); font-size: 15px; }

  &__pet { scroll-margin-top: 80px; }

  &__empty { text-align: center; color: var(--muted); @include stack($space-4); align-items: center; padding: 30px 0; }

  &__become {
    align-self: center;
    @include plain-link(var(--muted));
    font-weight: 800;
    font-size: 14px;
    padding: $space-3;

    &:hover { color: var(--coral-deep); }
  }
}
</style>
