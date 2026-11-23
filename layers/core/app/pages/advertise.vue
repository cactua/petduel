<script setup lang="ts">
import site from '#site'
import { SPECIES, type AdvertiseStats, type PublicAd } from '#shared/models'

// Pagina per chi vuole fare pubblicità: chi la vede, come appare, cosa si sceglie, quanto costa e come scriverci.
// Gli annunci li crea poi un moderatore dal pannello (admin/ads)
const { t } = useI18n()
useHead({ title: () => t('advertise.title') })

const { data: stats } = await useFetch<AdvertiseStats>('/api/advertise/stats')
const compact = (n: number) => new Intl.NumberFormat(intlLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n)

// Anteprima di come appare un annuncio tra i duelli
const sample = computed<PublicAd>(() => ({
  id: 0, advertiser: t('advertise.sample.advertiser'), title: t('advertise.sample.title'), body: t('advertise.sample.body'),
  cta: t('advertise.sample.cta'), image: null, href: '',
}))

const choices = computed(() => [
  t('advertise.choose.place'),
  t('advertise.choose.lang'),
  ...(SPECIES.length ? [t('advertise.choose.category')] : []),
  t('advertise.choose.audience'),
  t('advertise.choose.time'),
  t('advertise.choose.caps'),
])
const prices = computed(() => (['flat', 'cpm', 'cpc'] as const).map(k => ({ key: k, title: t(`advertise.prices.${k}.title`), text: t(`advertise.prices.${k}.text`) })))

// Email dal file .env (NUXT_PUBLIC_ADS_EMAIL, altrimenti quella delle pagine legali)
const { adsEmail, legal } = useRuntimeConfig().public
const email = adsEmail || legal.email
const mailto = computed(() => email
  ? `mailto:${email}?${new URLSearchParams({ subject: t('advertise.contact.subject', { site: site.name }), body: t('advertise.contact.body') }).toString().replaceAll('+', '%20')}`
  : '')
</script>

<template>
  <article class="advertise">
    <header class="advertise__hero">
      <p class="advertise__eyebrow">{{ $t('advertise.eyebrow') }}</p>
      <h1 class="advertise__title">{{ $t('advertise.title') }}</h1>
      <p class="advertise__lead">{{ $t('advertise.lead') }}</p>
      <a v-if="mailto" :href="mailto" class="btn btn--primary btn--lg advertise__cta">{{ $t('advertise.contact.button') }}</a>
    </header>

    <section v-if="stats && stats.votes" class="advertise__section" aria-labelledby="ad-numbers">
      <h2 id="ad-numbers" class="advertise__heading">{{ $t('advertise.numbers.title') }}</h2>
      <dl class="advertise__stats">
        <div class="advertise__stat"><dt>{{ $t('advertise.numbers.votes') }}</dt><dd>{{ compact(stats.votes) }}</dd></div>
        <div class="advertise__stat"><dt>{{ $t('advertise.numbers.voters') }}</dt><dd>{{ compact(stats.voters) }}</dd></div>
        <div class="advertise__stat"><dt>{{ $t('advertise.numbers.entries') }}</dt><dd>{{ compact(stats.entries) }}</dd></div>
      </dl>
      <p v-if="stats.every" class="advertise__note">{{ $t('advertise.numbers.every', { n: stats.every }) }}</p>
    </section>

    <section class="advertise__section advertise__how" aria-labelledby="ad-how">
      <div class="advertise__how-text">
        <h2 id="ad-how" class="advertise__heading">{{ $t('advertise.how.title') }}</h2>
        <p>{{ $t('advertise.how.text') }}</p>
        <p class="advertise__note">{{ $t('advertise.how.labelled') }}</p>
      </div>
      <div class="advertise__preview" :aria-label="$t('advertise.how.preview')" role="img">
        <AdCard :ad="sample" preview />
      </div>
    </section>

    <section class="advertise__section" aria-labelledby="ad-choose">
      <h2 id="ad-choose" class="advertise__heading">{{ $t('advertise.choose.title') }}</h2>
      <ul class="advertise__list">
        <li v-for="c in choices" :key="c">{{ c }}</li>
      </ul>
    </section>

    <section class="advertise__section" aria-labelledby="ad-prices">
      <h2 id="ad-prices" class="advertise__heading">{{ $t('advertise.prices.title') }}</h2>
      <div class="advertise__prices">
        <div v-for="p in prices" :key="p.key" class="advertise__price">
          <h3 class="advertise__price-title">{{ p.title }}</h3>
          <p>{{ p.text }}</p>
        </div>
      </div>
      <p class="advertise__note">{{ $t('advertise.prices.quote') }}</p>
    </section>

    <section class="advertise__section" aria-labelledby="ad-report">
      <h2 id="ad-report" class="advertise__heading">{{ $t('advertise.report.title') }}</h2>
      <p>{{ $t('advertise.report.text') }}</p>
    </section>

    <section class="advertise__section" aria-labelledby="ad-rules">
      <h2 id="ad-rules" class="advertise__heading">{{ $t('advertise.rules.title') }}</h2>
      <p>{{ $t('advertise.rules.text') }}</p>
    </section>

    <section class="advertise__section advertise__contact" aria-labelledby="ad-contact">
      <h2 id="ad-contact" class="advertise__heading">{{ $t('advertise.contact.title') }}</h2>
      <p>{{ $t('advertise.contact.text') }}</p>
      <template v-if="mailto">
        <a :href="mailto" class="btn btn--primary btn--lg advertise__cta">{{ $t('advertise.contact.button') }}</a>
        <p class="advertise__note">{{ $t('advertise.contact.or') }} <a :href="`mailto:${email}`" class="advertise__mail">{{ email }}</a></p>
      </template>
      <!-- Solo finché nel file .env manca l'email -->
      <p v-else class="advertise__note">[{{ $t('advertise.contact.missing') }}: NUXT_PUBLIC_ADS_EMAIL]</p>
    </section>
  </article>
</template>

<style lang="scss" scoped>
// Pagina: fare pubblicità sul sito
.advertise {
  @include stack($space-6);
  max-width: 860px;
  padding-bottom: 12px;

  p { margin: 0; max-width: 65ch; line-height: 1.55; }

  &__hero { @include card(24px, $radius-xl); @include stack($space-3); }

  &__eyebrow { @include eyebrow(12px); }

  &__title { font-size: clamp(26px, 5vw, 36px); line-height: 1.15; }

  &__lead { font-size: 17px; }

  &__cta { align-self: flex-start; margin-top: $space-2; }

  &__section { @include stack($space-3); }

  &__heading { font-size: 21px; }

  &__note { color: var(--muted); font-size: 14px; }

  &__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: $space-3; margin: 0; }

  &__stat {
    background: var(--surface);
    border-radius: $radius-md;
    padding: $space-4;
    box-shadow: $shadow-flat;

    dt { color: var(--muted); font-size: 14px; font-weight: 700; }

    dd { margin: 0; font-family: var(--display); font-size: 30px; font-weight: 800; }
  }

  // Testo e anteprima affiancati da tablet in su
  &__how {
    @include mq(md) { display: grid; grid-template-columns: 1fr 320px; gap: $space-6; align-items: start; }
  }

  &__how-text { @include stack($space-3); }

  &__preview { display: flex; height: 440px; margin-top: $space-3; @include mq(md) { margin-top: 0; } }

  &__list { margin: 0; padding-left: 1.2em; @include stack($space-2); line-height: 1.5; }

  &__prices { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: $space-3; }

  &__price { background: var(--surface); border-radius: $radius-md; padding: $space-4; box-shadow: $shadow-flat; @include stack($space-2); }

  &__price-title { font-size: 17px; }

  &__contact { @include card(24px, $radius-xl); }

  &__mail { color: var(--ink); font-weight: 700; overflow-wrap: anywhere; }
}
</style>
