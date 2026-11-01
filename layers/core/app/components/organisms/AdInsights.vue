<script setup lang="ts">
import type { AdminAd } from '#shared/models'

// Dettaglio di una campagna (admin): andamento, ore, provenienza, lingue, tetti, referente e note
const props = defineProps<{ ad: AdminAd }>()

const fmt = (n: number) => n.toLocaleString('it-IT')
const pct = (a: number, b: number) => (b ? `${(Math.min(1, a / b) * 100).toFixed(1).replace('.', ',')}%` : '—')
const series = (key: 'views' | 'clicks') => props.ad.days.map(d => ({ day: d.day, value: d[key] }))

const maxPlace = computed(() => Math.max(1, ...props.ad.places.map(p => p.views)))
const totalLangViews = computed(() => props.ad.languages.reduce((s, l) => s + l.views, 0) || 1)
const maxHour = computed(() => Math.max(1, ...props.ad.hours))
const peakHour = computed(() => (props.ad.hours.some(h => h) ? props.ad.hours.indexOf(Math.max(...props.ad.hours)) : null))

const caps = computed(() => [
  props.ad.deal.maxViews && { label: 'Visualizzazioni', done: props.ad.views, max: props.ad.deal.maxViews },
  props.ad.deal.maxClicks && { label: 'Clic', done: props.ad.clicks, max: props.ad.deal.maxClicks },
].filter(Boolean) as { label: string, done: number, max: number }[])
const hasContact = computed(() => props.ad.deal.contactName || props.ad.deal.contactEmail || props.ad.deal.contactPhone)

const copied = ref('')
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => (copied.value = ''), 1500)
  }
  catch {
    // Appunti non disponibili: il testo resta selezionabile a mano
  }
}
</script>

<template>
  <div class="ad-insights">
    <div class="ad-insights__charts">
      <AdminBars title="Visualizzazioni, 14 giorni" :days="series('views')" class="admin-bars--flat" />
      <AdminBars title="Clic, 14 giorni" :days="series('clicks')" color="var(--mint)" class="admin-bars--flat" />
    </div>

    <div class="ad-insights__grid">
      <section class="ad-insights__card">
        <h4 class="ad-insights__title">Da dove</h4>
        <p v-if="!ad.places.length" class="ad-insights__none">Ancora nessun dato.</p>
        <ol v-else class="ad-insights__rows">
          <li v-for="p in ad.places" :key="`${p.country}-${p.city}`" class="ad-insights__row">
            <span class="ad-insights__where">{{ flag(p.country) }} {{ p.city || countryName(p.country) }}<small v-if="p.city">{{ countryName(p.country) }}</small></span>
            <span class="ad-insights__meter"><span class="ad-insights__fill" :style="{ width: `${(p.views / maxPlace) * 100}%` }" /></span>
            <span class="ad-insights__num">{{ fmt(p.views) }}<small>{{ fmt(p.clicks) }} clic · {{ pct(p.clicks, p.views) }}</small></span>
          </li>
        </ol>
      </section>

      <section class="ad-insights__card">
        <h4 class="ad-insights__title">Lingua del sito</h4>
        <p v-if="!ad.languages.length" class="ad-insights__none">Ancora nessun dato.</p>
        <ol v-else class="ad-insights__rows">
          <li v-for="l in ad.languages" :key="l.lang ?? '-'" class="ad-insights__row">
            <span class="ad-insights__where">{{ l.lang ? LANG_NAMES[l.lang] ?? l.lang : 'Non nota' }}</span>
            <span class="ad-insights__meter"><span class="ad-insights__fill" :style="{ width: `${(l.views / totalLangViews) * 100}%`, background: 'var(--sun-deep)' }" /></span>
            <span class="ad-insights__num">{{ pct(l.views, totalLangViews) }}<small>{{ fmt(l.views) }} viste · {{ fmt(l.clicks) }} clic</small></span>
          </li>
        </ol>
      </section>

      <section class="ad-insights__card">
        <h4 class="ad-insights__title">Ore del giorno <small v-if="peakHour !== null">più vista verso le {{ peakHour }}:00</small></h4>
        <div class="ad-insights__hours" role="list" aria-label="Visualizzazioni per ora, ora italiana">
          <div v-for="(v, h) in ad.hours" :key="h" class="ad-insights__hour" role="listitem" tabindex="0" :aria-label="`${h}:00: ${v}`">
            <span class="ad-insights__bar" :style="{ height: v ? `max(3px, ${(v / maxHour) * 100}%)` : '0' }" />
            <span class="ad-insights__tip">{{ h }}:00 · <b>{{ fmt(v) }}</b></span>
          </div>
        </div>
        <div class="ad-insights__axis" aria-hidden="true"><span>0</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
      </section>

      <section class="ad-insights__card">
        <h4 class="ad-insights__title">Accordo</h4>
        <dl class="ad-insights__deal">
          <div class="ad-insights__fact"><dt>Oggi</dt><dd>{{ fmt(ad.viewsToday) }} visualizzazioni</dd></div>
          <div v-if="ad.deal.priceType !== 'none'" class="ad-insights__fact"><dt>Prezzo</dt><dd>{{ priceSummary(ad.deal) }}</dd></div>
          <div v-if="ad.deal.priceType !== 'none'" class="ad-insights__fact"><dt>Valore maturato</dt><dd class="ad-insights__value">{{ formatEuro(ad.valueCents) }}</dd></div>
          <div v-if="ad.deal.maxPerPersonDay" class="ad-insights__fact"><dt>Per persona</dt><dd>max {{ ad.deal.maxPerPersonDay }} al giorno</dd></div>
        </dl>
        <div v-for="c in caps" :key="c.label" class="ad-insights__cap">
          <span>{{ c.label }}: <b>{{ fmt(c.done) }}</b> di {{ fmt(c.max) }}</span>
          <span class="ad-insights__meter ad-insights__meter--big"><span class="ad-insights__fill" :style="{ width: `${Math.min(100, (c.done / c.max) * 100)}%` }" :class="{ 'ad-insights__fill--full': c.done >= c.max }" /></span>
        </div>
        <p v-if="ad.deal.priceType === 'none' && !caps.length && !ad.deal.maxPerPersonDay" class="ad-insights__none">Nessun prezzo o tetto impostato.</p>
      </section>

      <section v-if="hasContact || ad.deal.notes" class="ad-insights__card ad-insights__card--wide">
        <h4 class="ad-insights__title">Referente e note</h4>
        <div v-if="hasContact" class="ad-insights__contact">
          <b v-if="ad.deal.contactName">{{ ad.deal.contactName }}</b>
          <span v-if="ad.deal.contactEmail" class="ad-insights__copyable">
            <a :href="`mailto:${ad.deal.contactEmail}`" class="ad-insights__copy-text">{{ ad.deal.contactEmail }}</a>
            <button type="button" class="ad-insights__copy" @click="copy(ad.deal.contactEmail)">{{ copied === ad.deal.contactEmail ? 'Copiata ✓' : 'Copia' }}</button>
          </span>
          <span v-if="ad.deal.contactPhone" class="ad-insights__copyable">
            <a :href="`tel:${ad.deal.contactPhone.replace(/\s/g, '')}`" class="ad-insights__copy-text">{{ ad.deal.contactPhone }}</a>
            <button type="button" class="ad-insights__copy" @click="copy(ad.deal.contactPhone)">{{ copied === ad.deal.contactPhone ? 'Copiato ✓' : 'Copia' }}</button>
          </span>
        </div>
        <p v-if="ad.deal.notes" class="ad-insights__notes">{{ ad.deal.notes }}</p>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: statistiche di un annuncio (admin)
.ad-insights {
  @include stack($space-3);

  &__charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: $space-3; }

  &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: $space-3; }

  &__card {
    background: var(--bg);
    border-radius: $radius-md;
    padding: 12px 14px;
    @include stack($space-3);
    min-width: 0;

    &--wide { grid-column: 1 / -1; }
  }

  &__title {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    gap: $space-3;
    flex-wrap: wrap;

    small { font-weight: 700; font-size: 12px; }
  }

  &__none { margin: 0; font-size: 13px; color: var(--muted); }

  &__rows { list-style: none; margin: 0; padding: 0; @include stack($space-3); }

  &__row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(40px, 1fr) auto; gap: $space-4; align-items: center; font-size: 13px; }

  &__where {
    font-weight: 800;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    small { font-weight: 600; color: var(--muted); font-size: 11px; }
  }

  &__num {
    text-align: right;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;

    small { font-weight: 600; color: var(--muted); font-size: 11px; }
  }

  &__meter {
    height: 8px;
    border-radius: $radius-pill;
    background: var(--line);
    overflow: hidden;
    display: block;

    &--big { height: 10px; }
  }

  &__fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--coral);

    &--full { background: var(--mint); }
  }

  &__hours { height: 70px; display: flex; align-items: flex-end; gap: 2px; border-bottom: 1px solid var(--line); }

  &__hour {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    position: relative;
    outline: none;

    &:first-child .ad-insights__tip { left: 0; transform: none; }

    &:last-child .ad-insights__tip { left: auto; right: 0; transform: none; }

    &:hover .ad-insights__tip, &:focus-visible .ad-insights__tip { opacity: 1; }
  }

  &__bar { width: 100%; border-radius: 3px 3px 0 0; background: var(--sun); }

  &__tip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    white-space: nowrap;
    background: var(--ink);
    color: var(--bg);
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 8px;
    opacity: 0;
    pointer-events: none;
  }

  &__axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-weight: 700; }

  &__deal { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-3; }

  &__fact {
    display: flex;
    flex-direction: column;

    dt { font-size: 11px; font-weight: 800; color: var(--muted); }

    dd { margin: 0; font-weight: 800; font-size: 14px; }
  }

  &__value { font-family: var(--display); font-size: 20px !important; color: var(--mint); }

  &__cap { @include stack($space-1); font-size: 13px; }

  &__contact { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; font-size: 14px; }

  &__copyable { display: inline-flex; align-items: center; gap: $space-2; }

  &__copy-text { color: var(--ink); font-weight: 700; user-select: all; }

  &__copy { border: 0; background: var(--line); color: var(--ink); @include pill(3px, 10px); font-size: 12px; font-weight: 800; cursor: pointer; }

  &__notes { margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
}
</style>
