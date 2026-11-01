<script setup lang="ts">
import { shelterImageSources } from '#shared/images'
import type { ShelterPage, Social } from '#shared/models'

const route = useRoute()
const { data: shelter, error } = await useFetch<ShelterPage>(() => `/api/shelters/${route.params.slug}`)

const { t } = useI18n()
useHead({ title: () => (shelter.value ? `${shelter.value.name} · PetDuel` : `${t('shelters.verified')} · PetDuel`) })
useSeoMeta({
  description: () => (shelter.value?.tagline || shelter.value?.description.slice(0, 160)) ?? '',
  ogImage: () => (shelter.value?.banner ? shelterImageSources(shelter.value.banner, 'banner').src : undefined),
})

const looking = computed(() => shelter.value?.pets.filter(p => p.adoptionInfo?.status !== 'adopted') ?? [])
const adopted = computed(() => shelter.value?.pets.filter(p => p.adoptionInfo?.status === 'adopted') ?? [])
const banner = computed(() => (shelter.value?.banner ? shelterImageSources(shelter.value.banner, 'banner') : null))
const logo = computed(() => (shelter.value?.logo ? shelterImageSources(shelter.value.logo, 'logo') : null))
const hasMap = computed(() => shelter.value?.lat != null && shelter.value?.lng != null)
const directions = computed(() => (hasMap.value ? directionsLinks(shelter.value!.lat!, shelter.value!.lng!) : null))
const socials = computed(() => Object.entries(shelter.value?.socials ?? {}) as [Social, string][])
const hasHelp = computed(() => !!shelter.value && !!(shelter.value.help || shelter.value.needs.length || shelter.value.donateUrl || shelter.value.iban))
const SOCIAL_ICONS: Record<Social, string> = { instagram: '📸', facebook: '👍', tiktok: '🎵', youtube: '▶️' }

const copied = ref(false)
async function copyIban() {
  try {
    await navigator.clipboard.writeText(shelter.value!.iban)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* resta selezionabile a mano */ }
}
</script>

<template>
  <section class="shelter-page">
    <p v-if="error" class="shelter-page__empty">{{ $t('shelters.notFound') }}</p>
    <article v-else-if="shelter" class="shelter-page__body" :style="accentStyle(shelter.accent)">
      <NuxtLink to="/rifugi" class="shelter-page__back">← {{ $t('shelters.title') }}</NuxtLink>

      <header class="shelter-page__card shelter-page__hero">
        <div class="shelter-page__banner">
          <picture v-if="banner" class="shelter-page__cover">
            <source type="image/avif" :srcset="banner.avif" sizes="(min-width: 1000px) 1000px, 100vw">
            <source type="image/webp" :srcset="banner.webp" sizes="(min-width: 1000px) 1000px, 100vw">
            <img :src="banner.src" alt="" fetchpriority="high" class="shelter-page__cover">
          </picture>
          <span v-else class="shelter-page__paws" aria-hidden="true">🐾 🐾 🐾</span>
        </div>
        <div class="shelter-page__identity">
          <div class="shelter-page__logo">
            <picture v-if="logo" class="shelter-page__cover">
              <source type="image/avif" :srcset="logo.avif" sizes="112px">
              <source type="image/webp" :srcset="logo.webp" sizes="112px">
              <img :src="logo.src" :alt="$t('shelterPage.logoAlt', { name: shelter.name })" class="shelter-page__cover">
            </picture>
            <span v-else aria-hidden="true">{{ shelter.name.slice(0, 1) }}</span>
          </div>
          <div class="shelter-page__names">
            <span class="badge shelter-page__badge">✓ {{ $t('shelter.verified') }}</span>
            <h1 class="shelter-page__title">{{ shelter.name }}</h1>
            <p v-if="shelter.tagline" class="shelter-page__tagline">{{ shelter.tagline }}</p>
            <p class="shelter-page__meta">📍 {{ shelter.city }}</p>
          </div>
        </div>
        <ul class="shelter-page__stats">
          <li class="shelter-page__stat"><b class="shelter-page__stat-value">{{ shelter.available }}</b><span class="shelter-page__stat-label">{{ $t('shelterPage.waiting') }}</span></li>
          <li class="shelter-page__stat"><b class="shelter-page__stat-value">{{ shelter.adopted }}</b><span class="shelter-page__stat-label">{{ $t('shelterPage.foundHome') }}</span></li>
        </ul>
        <nav class="shelter-page__actions" :aria-label="$t('shelterPage.actions')">
          <a v-if="looking.length" href="#ospiti" class="shelter-page__action shelter-page__action--main">🐶 {{ $t('shelterPage.meet') }}</a>
          <a v-if="shelter.donateUrl" :href="shelter.donateUrl" target="_blank" rel="noopener noreferrer nofollow" class="shelter-page__action">💝 {{ $t('shelterPage.donate') }}</a>
          <a v-if="shelter.website" :href="shelter.website" target="_blank" rel="noopener noreferrer nofollow" class="shelter-page__action">🌐 {{ $t('shelterPage.site') }}</a>
          <a v-if="shelter.publicPhone" :href="`tel:${shelter.publicPhone.replace(/\s/g, '')}`" class="shelter-page__action">📞 {{ $t('shelterPage.call') }}</a>
          <a v-if="shelter.publicEmail" :href="`mailto:${shelter.publicEmail}`" class="shelter-page__action">✉️ {{ $t('shelterPage.write') }}</a>
          <a v-if="directions" :href="directions.google" target="_blank" rel="noopener noreferrer" class="shelter-page__action">🧭 {{ $t('shelterPage.directions') }}</a>
        </nav>
      </header>

      <div class="shelter-page__layout">
        <div class="shelter-page__main">
          <section class="shelter-page__card">
            <h2 class="shelter-page__heading">{{ $t('shelterPage.about') }}</h2>
            <p class="shelter-page__text">{{ shelter.description }}</p>
          </section>

          <section id="ospiti" class="shelter-page__pets">
            <h2 class="shelter-page__heading">{{ $t('shelters.looking') }} <small v-if="looking.length" class="shelter-page__count">{{ looking.length }}</small></h2>
            <p v-if="!looking.length" class="shelter-page__empty">{{ $t('shelters.noneLooking') }}</p>
            <PetGallery v-for="pet in looking" :key="pet.id" :pet="pet" link-title />
          </section>

          <section v-if="adopted.length" class="shelter-page__pets">
            <h2 class="shelter-page__heading">{{ $t('shelters.adoptedTitle') }} 🎉</h2>
            <PetGallery v-for="pet in adopted" :key="pet.id" :pet="pet" link-title />
          </section>
        </div>

        <aside class="shelter-page__side">
          <section v-if="hasHelp" class="shelter-page__card shelter-page__card--help">
            <h2 class="shelter-page__heading">💝 {{ $t('shelterPage.help') }}</h2>
            <p v-if="shelter.help" class="shelter-page__text">{{ shelter.help }}</p>
            <template v-if="shelter.needs.length">
              <h3 class="shelter-page__subheading">{{ $t('shelterPage.needs') }}</h3>
              <ul class="shelter-page__needs">
                <li v-for="n in shelter.needs" :key="n" class="shelter-page__need">{{ n }}</li>
              </ul>
            </template>
            <a v-if="shelter.donateUrl" :href="shelter.donateUrl" target="_blank" rel="noopener noreferrer nofollow" class="shelter-page__action shelter-page__action--main shelter-page__action--wide">💝 {{ $t('shelterPage.donate') }}</a>
            <div v-if="shelter.iban" class="shelter-page__iban">
              <span class="shelter-page__iban-label">IBAN · {{ shelter.name }}</span>
              <code class="shelter-page__iban-code">{{ formatIban(shelter.iban) }}</code>
              <button type="button" class="btn btn--ghost btn--sm shelter-page__copy" @click="copyIban">{{ copied ? $t('shelterPage.copied') : $t('shelterPage.copy') }}</button>
            </div>
          </section>

          <section v-if="hasMap || shelter.address || shelter.hours" class="shelter-page__card">
            <h2 class="shelter-page__heading">📍 {{ $t('shelterPage.where') }}</h2>
            <div v-if="hasMap" class="shelter-page__map">
              <ClientOnly>
                <ShelterMap :lat="shelter.lat" :lng="shelter.lng" :label="$t('shelterPage.mapOf', { name: shelter.name })" />
              </ClientOnly>
            </div>
            <p v-if="shelter.address" class="shelter-page__address">{{ shelter.address }}<br><small class="u-muted">{{ shelter.city }}</small></p>
            <p v-if="directions" class="shelter-page__links">
              <a :href="directions.osm" target="_blank" rel="noopener noreferrer" class="shelter-page__link">OpenStreetMap ↗</a>
              <a :href="directions.google" target="_blank" rel="noopener noreferrer" class="shelter-page__link">Google Maps ↗</a>
            </p>
            <template v-if="shelter.hours">
              <h3 class="shelter-page__subheading">🕒 {{ $t('shelterPage.hours') }}</h3>
              <p class="shelter-page__text">{{ shelter.hours }}</p>
            </template>
          </section>

          <section v-if="socials.length || shelter.publicEmail || shelter.publicPhone" class="shelter-page__card">
            <h2 class="shelter-page__heading">{{ $t('shelterPage.follow') }}</h2>
            <ul class="shelter-page__contacts">
              <li v-if="shelter.publicPhone"><a :href="`tel:${shelter.publicPhone.replace(/\s/g, '')}`" class="shelter-page__link">📞 {{ shelter.publicPhone }}</a></li>
              <li v-if="shelter.publicEmail"><a :href="`mailto:${shelter.publicEmail}`" class="shelter-page__link">✉️ {{ shelter.publicEmail }}</a></li>
              <li v-for="[s, url] in socials" :key="s">
                <a :href="url" target="_blank" rel="noopener noreferrer nofollow" class="shelter-page__link">{{ SOCIAL_ICONS[s] }} {{ $t(`shelterEdit.social.${s}`) }} ↗</a>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </article>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: pagina pubblica di un rifugio, nel suo colore
.shelter-page {
  padding-bottom: 12px;

  &__body { @include stack($space-6); --accent-soft: color-mix(in srgb, var(--accent) 16%, var(--surface)); }

  &__back { @include plain-link(var(--muted)); font-weight: 700; }

  &__card {
    @include card(18px, $radius-xl);
    @include stack($space-4);
    min-width: 0;

    &--help { background: var(--accent-soft); }
  }

  &__title { font-size: clamp(26px, 6vw, 36px); line-height: 1.1; text-wrap: balance; }

  &__heading { font-size: 20px; display: flex; align-items: center; gap: $space-3; }

  &__count { font-family: var(--body); font-size: 13px; font-weight: 900; background: var(--accent); color: var(--accent-ink); @include pill(2px, 9px); }

  &__subheading { font-size: 15px; margin-top: $space-1; }

  &__text { margin: 0; white-space: pre-line; line-height: 1.6; max-width: 65ch; overflow-wrap: anywhere; }

  // Testata: banner, logo che lo sovrappone, nome e bottoni
  &__hero { padding: 0 0 18px; overflow: hidden; gap: $space-6; }

  &__banner {
    aspect-ratio: 5 / 2;
    max-height: 340px;
    width: 100%;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--sun)));
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  &__cover { width: 100%; height: 100%; object-fit: cover; display: block; }

  &__paws { font-size: clamp(28px, 8vw, 54px); letter-spacing: .4em; opacity: .35; transform: rotate(-8deg); }

  // Sui telefoni il nome va sotto il logo
  &__identity {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $space-3;
    padding: 0 18px;
    margin-top: -48px;

    @include mq(sm) { flex-direction: row; align-items: flex-end; gap: $space-6; margin-top: -52px; }
  }

  &__logo {
    flex: none;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    overflow: hidden;
    border: 5px solid var(--surface);
    background: var(--accent);
    color: var(--accent-ink);
    display: grid;
    place-items: center;
    font-family: var(--display);
    font-size: 40px;
    font-weight: 700;
    box-shadow: 0 8px 20px -10px var(--shadow);

    @include mq(sm) { width: 112px; height: 112px; font-size: 48px; }
  }

  &__names {
    @include stack($space-1);
    align-items: flex-start;
    min-width: 0;

    @include mq(sm) { padding-top: 56px; }
  }

  &__badge { background: var(--accent-soft); border: 0; padding: 3px 11px; }

  &__tagline { margin: 0; font-weight: 800; font-size: 16px; color: var(--ink); }

  &__meta { margin: 0; color: var(--muted); font-weight: 700; }

  &__stats { list-style: none; margin: 0; padding: 0 18px; @include cluster($space-4); }

  &__stat { flex: 1 1 0; max-width: 200px; display: flex; flex-direction: column; align-items: center; padding: 8px 12px; border-radius: 16px; background: var(--accent-soft); text-align: center; }

  &__stat-value { font-family: var(--display); font-size: 24px; line-height: 1.1; }

  &__stat-label { font-weight: 800; font-size: 13px; color: var(--muted); }

  &__actions { @include cluster($space-3); padding: 0 18px; }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    @include pill(9px, 15px);
    font-weight: 800;
    font-size: 14px;
    @include plain-link(var(--ink));
    background: var(--surface);
    border: 2px solid var(--line);

    &--main { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }

    &--wide { width: 100%; padding: 12px; }
  }

  // Due colonne su schermi larghi: ospiti a sinistra, informazioni a destra
  &__layout {
    display: grid;
    gap: $space-6;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;

    @include mq(lg) { grid-template-columns: minmax(0, 1fr) 320px; }
  }

  &__main, &__side { @include stack($space-6); min-width: 0; }

  &__side { @include mq(lg) { position: sticky; top: 80px; } }

  &__pets { @include stack($space-6); scroll-margin-top: 80px; }

  &__needs { list-style: none; margin: 0; padding: 0; @include cluster($space-2); }

  &__need { @include pill(5px, 12px); background: var(--surface); font-weight: 800; font-size: 14px; }

  &__iban { @include stack($space-1); padding: 12px; border-radius: 16px; background: var(--surface); }

  &__iban-label { font-size: 12px; font-weight: 800; color: var(--muted); }

  &__iban-code { font-size: 15px; font-weight: 700; user-select: all; overflow-wrap: anywhere; }

  &__copy { align-self: flex-start; }

  &__map { height: 240px; border-radius: $radius-md; overflow: hidden; }

  &__address { margin: 0; font-weight: 700; line-height: 1.4; }

  &__links { margin: 0; @include cluster($space-6); }

  &__contacts { list-style: none; margin: 0; padding: 0; @include stack($space-3); }

  &__link {
    @include plain-link(var(--ink));
    font-weight: 800;
    overflow-wrap: anywhere;

    &:hover { text-decoration: underline; }
  }

  &__empty { text-align: center; color: var(--muted); padding: 20px 0; margin: 0; }
}
</style>
