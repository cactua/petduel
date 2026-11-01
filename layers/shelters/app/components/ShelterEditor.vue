<script setup lang="ts">
import {
  MAX_NEEDS, SHELTER_ACCENTS, SOCIALS, shelterProfileSchema,
  type GeocodeResult, type MyShelter, type ShelterProfile,
} from '#shared/models'

/** Personalizzazione della pagina pubblica del rifugio, divisa per sezioni */
const props = defineProps<{ shelter: NonNullable<MyShelter['shelter']> }>()
const emit = defineEmits<{ saved: [], cancel: [], images: [] }>()
const { t } = useI18n()

const pickProfile = (s: ShelterProfile): ShelterProfile => structuredClone({
  description: s.description, tagline: s.tagline, help: s.help, needs: [...s.needs], accent: s.accent,
  address: s.address, lat: s.lat, lng: s.lng, hours: s.hours, website: s.website,
  publicEmail: s.publicEmail, publicPhone: s.publicPhone, socials: { ...s.socials },
  donateUrl: s.donateUrl, iban: s.iban, contactEmail: s.contactEmail, phone: s.phone,
})
const form = reactive(pickProfile(props.shelter))

// --- Bisogni: elenco breve di cose che servono ---
const need = ref('')
function addNeed() {
  const v = need.value.trim()
  if (!v || form.needs.length >= MAX_NEEDS || form.needs.includes(v)) return
  form.needs.push(v.slice(0, 60))
  need.value = ''
}

// --- Dove siamo: ricerca dell'indirizzo su OpenStreetMap o tocco sulla mappa ---
const results = ref<GeocodeResult[] | null>(null)
const searching = ref(false)
const geoError = ref('')
async function searchAddress() {
  const q = [form.address, props.shelter.city].filter(Boolean).join(', ')
  if (form.address.trim().length < 3) {
    geoError.value = t('shelterEdit.addressFirst')
    return
  }
  searching.value = true
  geoError.value = ''
  try {
    results.value = await $fetch<GeocodeResult[]>('/api/geocode', { query: { q } })
    if (results.value.length === 1) choose(results.value[0]!)
    else if (!results.value.length) geoError.value = t('shelterEdit.noResults')
  }
  catch (e) {
    geoError.value = errorMessage(e)
  }
  finally {
    searching.value = false
  }
}
function choose(r: GeocodeResult) {
  form.lat = r.lat
  form.lng = r.lng
  results.value = null
}
function onPick(lat: number, lng: number) {
  form.lat = lat
  form.lng = lng
}
const showMap = ref(form.lat !== null)

// --- Salvataggio ---
const error = ref('')
const sending = ref(false)
async function save() {
  error.value = ''
  const check = shelterProfileSchema.safeParse(form)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  try {
    await $fetch('/api/shelters/me', { method: 'PATCH', body: check.data })
    emit('saved')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
const SOCIAL_ICONS = { instagram: '📸', facebook: '👍', tiktok: '🎵', youtube: '▶️' } as const
</script>

<template>
  <form class="shelter-editor" novalidate @submit.prevent="save">
    <!-- Aspetto -->
    <fieldset class="shelter-editor__section">
      <legend class="shelter-editor__legend">🎨 {{ $t('shelterEdit.look') }}</legend>
      <span class="label shelter-editor__label">{{ $t('shelterEdit.banner') }} <small>{{ $t('shelterEdit.bannerHint') }}</small></span>
      <ShelterImagePicker :id="shelter.banner" kind="banner" @change="emit('images')" />
      <span class="label shelter-editor__label">{{ $t('shelterEdit.logo') }}</span>
      <ShelterImagePicker :id="shelter.logo" kind="logo" @change="emit('images')" />
      <span id="accent-label" class="label shelter-editor__label">{{ $t('shelterEdit.accent') }}</span>
      <div class="shelter-editor__swatches" role="radiogroup" aria-labelledby="accent-label">
        <button
          v-for="a in SHELTER_ACCENTS" :key="a" type="button" role="radio"
          :aria-checked="form.accent === a" :aria-label="$t(`shelterEdit.accents.${a}`)"
          class="shelter-editor__swatch" :class="{ 'is-active': form.accent === a }" :style="accentStyle(a)" @click="form.accent = a"
        >
          <span v-if="form.accent === a" aria-hidden="true">✓</span>
        </button>
      </div>
      <label for="e-tagline" class="label shelter-editor__label">{{ $t('shelterEdit.tagline') }} <small>({{ $t('common.optional') }})</small></label>
      <input id="e-tagline" v-model="form.tagline" maxlength="90" :placeholder="$t('shelterEdit.taglinePlaceholder')" class="input">
    </fieldset>

    <!-- Chi siamo e come aiutarci -->
    <fieldset class="shelter-editor__section">
      <legend class="shelter-editor__legend">💬 {{ $t('shelterEdit.story') }}</legend>
      <label for="e-desc" class="label shelter-editor__label">{{ $t('area.description') }}</label>
      <textarea id="e-desc" v-model="form.description" rows="5" maxlength="600" class="input" />
      <label for="e-help" class="label shelter-editor__label">{{ $t('shelterEdit.help') }} <small>({{ $t('common.optional') }})</small></label>
      <textarea id="e-help" v-model="form.help" rows="4" maxlength="800" :placeholder="$t('shelterEdit.helpPlaceholder')" class="input" />
      <label for="e-need" class="label shelter-editor__label">{{ $t('shelterEdit.needs') }} <small>({{ form.needs.length }}/{{ MAX_NEEDS }})</small></label>
      <div class="shelter-editor__inline">
        <input id="e-need" v-model="need" maxlength="60" :placeholder="$t('shelterEdit.needsPlaceholder')" :disabled="form.needs.length >= MAX_NEEDS" class="input" @keydown.enter.prevent="addNeed">
        <button type="button" class="btn btn--ghost" :disabled="!need.trim() || form.needs.length >= MAX_NEEDS" @click="addNeed">{{ $t('shelterEdit.add') }}</button>
      </div>
      <ul v-if="form.needs.length" class="shelter-editor__chips">
        <li v-for="(n, i) in form.needs" :key="n" class="shelter-editor__chip">
          {{ n }}
          <button type="button" class="shelter-editor__chip-remove" :aria-label="$t('shelterEdit.removeItem', { item: n })" @click="form.needs.splice(i, 1)">×</button>
        </li>
      </ul>
      <div class="shelter-editor__row">
        <div class="field">
          <label for="e-donate" class="label shelter-editor__label">{{ $t('shelterEdit.donateUrl') }} <small>({{ $t('common.optional') }})</small></label>
          <input id="e-donate" v-model="form.donateUrl" type="url" maxlength="200" placeholder="https://paypal.me/…" class="input">
        </div>
        <div class="field">
          <label for="e-iban" class="label shelter-editor__label">IBAN <small>({{ $t('common.optional') }})</small></label>
          <input id="e-iban" v-model="form.iban" maxlength="42" autocapitalize="characters" spellcheck="false" placeholder="IT60 X054 2811 1010 0000 0123 456" class="input">
        </div>
      </div>
    </fieldset>

    <!-- Dove siamo -->
    <fieldset class="shelter-editor__section">
      <legend class="shelter-editor__legend">📍 {{ $t('shelterEdit.where') }}</legend>
      <label for="e-address" class="label shelter-editor__label">{{ $t('shelterEdit.address') }} <small>({{ shelter.city }})</small></label>
      <div class="shelter-editor__inline">
        <input id="e-address" v-model="form.address" maxlength="140" :placeholder="$t('shelterEdit.addressPlaceholder')" class="input" @keydown.enter.prevent="searchAddress">
        <button type="button" class="btn btn--ghost" :disabled="searching" @click="searchAddress">{{ searching ? '…' : $t('shelterEdit.findOnMap') }}</button>
      </div>
      <p v-if="geoError" class="error" role="alert">{{ geoError }}</p>
      <ul v-if="results?.length" class="shelter-editor__results">
        <li v-for="r in results" :key="`${r.lat},${r.lng}`"><button type="button" class="shelter-editor__result" @click="choose(r)">{{ r.label }}</button></li>
      </ul>
      <div v-if="showMap || form.lat !== null" class="shelter-editor__map" :style="accentStyle(form.accent)">
        <ClientOnly>
          <ShelterMap :lat="form.lat" :lng="form.lng" editable :label="$t('shelterEdit.mapLabel')" @pick="onPick" />
        </ClientOnly>
      </div>
      <p class="hint">
        {{ form.lat !== null ? $t('shelterEdit.mapHint') : $t('shelterEdit.mapEmpty') }}
        <button v-if="form.lat === null && !showMap" type="button" class="btn btn--link" @click="showMap = true">{{ $t('shelterEdit.pinByHand') }}</button>
        <button v-if="form.lat !== null" type="button" class="btn btn--link" @click="form.lat = null; form.lng = null; showMap = false">{{ $t('shelterEdit.hideMap') }}</button>
      </p>
      <label for="e-hours" class="label shelter-editor__label">{{ $t('shelterEdit.hours') }} <small>({{ $t('common.optional') }})</small></label>
      <textarea id="e-hours" v-model="form.hours" rows="3" maxlength="300" :placeholder="$t('shelterEdit.hoursPlaceholder')" class="input" />
    </fieldset>

    <!-- Contatti -->
    <fieldset class="shelter-editor__section">
      <legend class="shelter-editor__legend">✉️ {{ $t('shelterEdit.contacts') }}</legend>
      <label for="e-site" class="label shelter-editor__label">{{ $t('area.website') }} <small>({{ $t('common.optional') }})</small></label>
      <input id="e-site" v-model="form.website" type="url" maxlength="200" placeholder="https://" class="input">
      <div class="shelter-editor__row">
        <div class="field"><label for="e-pmail" class="label shelter-editor__label">{{ $t('shelterEdit.publicEmail') }} <small>({{ $t('common.optional') }})</small></label><input id="e-pmail" v-model="form.publicEmail" type="email" maxlength="254" class="input"></div>
        <div class="field"><label for="e-pphone" class="label shelter-editor__label">{{ $t('shelterEdit.publicPhone') }} <small>({{ $t('common.optional') }})</small></label><input id="e-pphone" v-model="form.publicPhone" type="tel" maxlength="30" class="input"></div>
      </div>
      <div class="shelter-editor__row">
        <div v-for="s in SOCIALS" :key="s" class="field">
          <label :for="`e-${s}`" class="label shelter-editor__label">{{ SOCIAL_ICONS[s] }} {{ $t(`shelterEdit.social.${s}`) }}</label>
          <input :id="`e-${s}`" v-model="form.socials[s]" type="url" maxlength="200" :placeholder="`https://www.${s}.com/…`" class="input">
        </div>
      </div>
      <p class="hint">🔒 {{ $t('shelterEdit.privateHint') }}</p>
      <div class="shelter-editor__row">
        <div class="field"><label for="e-mail" class="label shelter-editor__label">{{ $t('area.modEmail') }}</label><input id="e-mail" v-model="form.contactEmail" type="email" maxlength="254" class="input"></div>
        <div class="field"><label for="e-phone" class="label shelter-editor__label">{{ $t('adoption.phone') }} <small>({{ $t('area.private') }})</small></label><input id="e-phone" v-model="form.phone" type="tel" maxlength="30" class="input"></div>
      </div>
    </fieldset>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="shelter-editor__buttons">
      <button type="button" class="btn btn--ghost" @click="emit('cancel')">{{ $t('common.cancel') }}</button>
      <button type="submit" class="btn btn--primary btn--lg" :disabled="sending">{{ sending ? $t('common.sending') : $t('common.save') }}</button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
// Organismo: modulo per personalizzare la pagina del rifugio
.shelter-editor {
  @include stack($space-6);
  width: 100%;

  &__section { @include stack($space-2); margin: 0; padding: 14px; border: 2px solid var(--line); border-radius: 20px; min-width: 0; }

  &__legend { font-family: var(--display); font-weight: 700; font-size: 17px; padding: 0 6px; }

  &__label { margin-top: $space-1; }

  &__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: $space-4; }

  &__inline {
    display: flex;
    gap: $space-3;
    align-items: center;

    .input { flex: 1; min-width: 0; }

    .btn { flex: none; }
  }

  &__swatches { @include cluster($space-4); }

  &__swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid var(--surface);
    cursor: pointer;
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 900;
    box-shadow: 0 0 0 2px var(--line);

    &.is-active { box-shadow: 0 0 0 3px var(--ink); }
  }

  &__chips { list-style: none; margin: 0; padding: 0; @include cluster($space-2); }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    padding: 4px 4px 4px 12px;
    border-radius: $radius-pill;
    background: var(--bg);
    border: 2px solid var(--line);
    font-weight: 700;
    font-size: 14px;
  }

  &__chip-remove { border: 0; background: none; color: var(--muted); font-size: 18px; line-height: 1; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; }

  &__results { list-style: none; margin: 0; padding: 0; @include stack($space-1); }

  &__result { width: 100%; text-align: left; background: var(--bg); border: 2px solid var(--line); border-radius: $radius-sm; padding: 8px 12px; color: var(--ink); font: inherit; font-size: 14px; cursor: pointer; }

  &__map { height: 260px; border-radius: $radius-md; overflow: hidden; }

  &__buttons { @include cluster($space-3); justify-content: flex-end; }
}
</style>
