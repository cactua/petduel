<script setup lang="ts">
import type { AdDeal } from '#shared/models'

// Accordo con l'inserzionista (admin): referente, prezzo, tetti e note. Non compare mai nell'annuncio
const d = defineModel<AdDeal>({ required: true })

// Prezzo scritto in euro ("12,50"), salvato in centesimi
const price = ref(d.value.priceCents ? (d.value.priceCents / 100).toFixed(2).replace('.', ',') : '')
watch(price, (v) => {
  const n = Number(v.replace(/\s|€/g, '').replace(',', '.'))
  d.value.priceCents = Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
})
const PRICE_LABEL = { none: '', flat: 'Totale concordato', cpm: 'Ogni 1.000 visualizzazioni', cpc: 'A clic' } as const

// Tetti: campo vuoto = nessun limite
const cap = (key: 'maxViews' | 'maxClicks' | 'maxPerPersonDay') => computed({
  get: () => d.value[key] ?? '',
  set: (v: number | string) => (d.value[key] = v === '' || !Number(v) ? null : Math.max(1, Math.round(Number(v)))),
})
const maxViews = cap('maxViews')
const maxClicks = cap('maxClicks')
const maxPerPersonDay = cap('maxPerPersonDay')
</script>

<template>
  <div class="admin-form ad-deal">
    <div class="admin-form__group">
      <span class="admin-form__label">Referente</span>
      <div class="admin-form__grid">
        <label>Nome<input v-model="d.contactName" maxlength="80" placeholder="Mario Rossi" autocomplete="off"></label>
        <label>Email<input v-model="d.contactEmail" type="email" maxlength="254" placeholder="mario@petshoprossi.it" autocomplete="off"></label>
        <label>Telefono<input v-model="d.contactPhone" type="tel" maxlength="40" placeholder="+39 011 123 4567" autocomplete="off"></label>
      </div>
    </div>

    <div class="admin-form__group">
      <span class="admin-form__label">Prezzo</span>
      <div class="admin-form__options" role="radiogroup" aria-label="Tipo di prezzo">
        <label class="admin-form__option" :class="{ 'is-active': d.priceType === 'none' }"><input v-model="d.priceType" type="radio" value="none"> Nessuno / gratis</label>
        <label class="admin-form__option" :class="{ 'is-active': d.priceType === 'flat' }"><input v-model="d.priceType" type="radio" value="flat"> Cifra fissa</label>
        <label class="admin-form__option" :class="{ 'is-active': d.priceType === 'cpm' }"><input v-model="d.priceType" type="radio" value="cpm"> A visualizzazioni</label>
        <label class="admin-form__option" :class="{ 'is-active': d.priceType === 'cpc' }"><input v-model="d.priceType" type="radio" value="cpc"> A clic</label>
      </div>
      <label v-if="d.priceType !== 'none'" class="ad-deal__money">{{ PRICE_LABEL[d.priceType] }}
        <span class="ad-deal__euro"><span class="ad-deal__sign" aria-hidden="true">€</span><input v-model="price" inputmode="decimal" placeholder="0,00" class="ad-deal__amount"></span>
      </label>
      <small class="admin-form__hint">Serve a te: nell'elenco vedi quanto vale la campagna in base a visualizzazioni e clic fatti.</small>
    </div>

    <div class="admin-form__group">
      <span class="admin-form__label">Tetti <em>vuoto = nessun limite</em></span>
      <div class="admin-form__grid">
        <label>Visualizzazioni in tutto<input v-model="maxViews" type="number" min="1" placeholder="es. 10000"></label>
        <label>Clic in tutto<input v-model="maxClicks" type="number" min="1" placeholder="es. 200"></label>
        <label>Volte al giorno a persona<input v-model="maxPerPersonDay" type="number" min="1" max="50" placeholder="es. 3"></label>
      </div>
      <small class="admin-form__hint">Raggiunto un tetto totale la campagna smette di uscire («Tetto raggiunto»); quello per persona vale per la giornata.</small>
    </div>

    <label>Note interne <em>solo per te</em>
      <textarea v-model="d.notes" rows="3" maxlength="2000" placeholder="Accordi, fatture, rinnovo a dicembre…" />
    </label>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: referente, prezzo e tetti di una campagna
.ad-deal {
  &__money { max-width: 260px; }

  &__euro { position: relative; display: block; }

  &__sign { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--muted); }

  .ad-deal__amount { padding-left: 28px; font-variant-numeric: tabular-nums; }
}
</style>
