<script setup lang="ts">
import { MAX_SONA_COLORS, type PetGallery, type SonaSheet } from '#shared/models'

/**
 * Scheda del personaggio (siti con site.sona): reference, descrizione, colori da copiare e regole per chi lo disegna.
 * Il proprietario la modifica qui sotto; gli altri vedono solo le parti compilate.
 */
// embedded: nella pagina del personaggio, sotto la galleria che ha già immagine, nome e Condividi:
// qui resta solo la scheda (e la reference solo se scelta ed è diversa dalla copertina)
const props = defineProps<{ pet: PetGallery, editable?: boolean, embedded?: boolean }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()

const EMPTY: SonaSheet = { species: '', pronouns: '', about: '', traits: '', palette: [], yes: [], no: [], refPhotoId: null }
const sona = computed<SonaSheet>(() => ({ ...EMPTY, ...props.pet.sona }))
const approved = computed(() => props.pet.photos.filter(p => p.image && (p.status === 'approved' || props.editable)))
// Reference: quella scelta, altrimenti l'immagine più recente
const ref_ = computed(() => approved.value.find(p => p.id === sona.value.refPhotoId) ?? approved.value[0] ?? null)

const facts = computed(() => [
  { k: t('sona.species'), v: sona.value.species },
  { k: t('sona.pronouns'), v: sona.value.pronouns },
  { k: t('sona.traits'), v: sona.value.traits },
].filter(f => f.v))
const cover = computed(() => props.pet.photos.find(p => p.status === 'approved' && p.image) ?? null)
const showRef = computed(() => !!ref_.value && (!props.embedded || (!!sona.value.refPhotoId && ref_.value.id !== cover.value?.id)))
const hasSheet = computed(() => facts.value.length || sona.value.about || sona.value.palette.length || sona.value.yes.length || sona.value.no.length)

// Visore a tutto schermo per la reference
const viewing = ref<number | null>(null)
const viewerPhotos = computed(() => ref_.value ? [{ image: ref_.value.image, alt: t('pet.photoOf', { name: props.pet.name }), credit: ref_.value.credit }] : [])

// Copia del colore: il risultato si annuncia anche a chi usa un lettore di schermo
const copied = ref('')
async function copy(hex: string) {
  try {
    await navigator.clipboard.writeText(hex)
    copied.value = t('sona.copied', { hex })
  }
  catch {
    copied.value = hex
  }
}

// Modifica (solo il proprietario)
const editing = ref(false)
const draft = reactive({ ...EMPTY, palette: [] as SonaSheet['palette'], yesText: '', noText: '' })
function startEdit() {
  Object.assign(draft, structuredClone(toRaw(sona.value)), { yesText: sona.value.yes.join('\n'), noText: sona.value.no.join('\n') })
  error.value = ''
  editing.value = true
}
const lines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6)
const saving = ref(false)
const error = ref('')
const status = ref('')
async function save() {
  saving.value = true
  error.value = ''
  try {
    const { yesText, noText, ...rest } = draft
    await $fetch(`/api/pets/${props.pet.id}/sona`, { method: 'PUT', body: { ...rest, yes: lines(yesText), no: lines(noText) } })
    editing.value = false
    status.value = t('sona.saved')
    emit('changed')
  }
  catch (e) {
    error.value = errorMessage(e, 'validation.check')
  }
  finally {
    saving.value = false
  }
}
const addColor = () => draft.palette.length < MAX_SONA_COLORS && draft.palette.push({ name: '', hex: '#c2410c' })
</script>

<template>
  <article v-if="!embedded || hasSheet || editable" class="sona" :aria-labelledby="`sona-${pet.id}`">
    <div v-if="showRef && ref_" class="sona__ref">
      <!-- Versione adatta al riquadro: orizzontale su computer, verticale su telefono, alla larghezza giusta -->
      <picture><source v-for="s in photoSources(ref_.image, 'v', '(min-width: 1040px) 1000px, 92vw', 'h')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="ref_.image" :alt="$t('pet.photoOf', { name: pet.name })" class="sona__ref-img" loading="lazy"></picture>
      <span v-if="ref_.credit" class="sona__ref-credit">{{ $t('sona.refBy', { artist: ref_.credit.text }) }}</span>
      <button type="button" class="sona__ref-open" :aria-label="$t('sona.openRef')" @click="viewing = 0">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
      </button>
    </div>

    <div class="sona__body">
      <div class="sona__head">
        <h2 :id="`sona-${pet.id}`" class="sona__name" :class="{ 'sona__name--small': embedded }">{{ embedded ? $t('sona.sheet') : pet.name }}</h2>
        <ShareCard v-if="!embedded" :pet-id="pet.id" :pet-name="pet.name" />
      </div>

      <template v-if="!editing">
        <p v-if="sona.about" class="sona__about">{{ sona.about }}</p>
        <dl v-if="facts.length" class="sona__facts">
          <template v-for="f in facts" :key="f.k"><dt>{{ f.k }}</dt><dd>{{ f.v }}</dd></template>
        </dl>

        <section v-if="sona.palette.length" class="sona__block" :aria-labelledby="`colors-${pet.id}`">
          <h3 :id="`colors-${pet.id}`" class="sona__label">{{ $t('sona.colors') }}</h3>
          <ul class="sona__palette">
            <li v-for="c in sona.palette" :key="c.hex + c.name">
              <button type="button" class="sona__swatch" :aria-label="$t('sona.copy', { name: c.name, hex: c.hex })" @click="copy(c.hex)">
                <span class="sona__chip" :style="{ background: c.hex }" />
                <span v-if="c.name" class="sona__swatch-name">{{ c.name }}</span>
                <span class="sona__swatch-hex">{{ c.hex }}</span>
              </button>
            </li>
          </ul>
          <p class="u-visually-hidden" role="status">{{ copied }}</p>
        </section>

        <section v-if="sona.yes.length || sona.no.length" class="sona__block" :aria-labelledby="`rules-${pet.id}`">
          <h3 :id="`rules-${pet.id}`" class="sona__label">{{ $t('sona.forArtists') }}</h3>
          <div class="sona__rules">
            <div v-if="sona.yes.length" class="sona__rule sona__rule--yes">
              <p class="sona__rule-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>{{ $t('sona.yes') }}</p>
              <ul><li v-for="r in sona.yes" :key="r">{{ r }}</li></ul>
            </div>
            <div v-if="sona.no.length" class="sona__rule sona__rule--no">
              <p class="sona__rule-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>{{ $t('sona.no') }}</p>
              <ul><li v-for="r in sona.no" :key="r">{{ r }}</li></ul>
            </div>
          </div>
        </section>

        <p v-if="editable && !hasSheet" class="sona__empty">{{ $t('sona.empty') }}</p>
        <p v-if="status" class="sona__status" role="status">{{ status }}</p>
        <button v-if="editable" type="button" class="btn btn--ghost sona__edit" @click="startEdit">{{ $t('sona.edit') }}</button>
      </template>

      <!-- Modulo del proprietario -->
      <form v-else class="sona__form" @submit.prevent="save">
        <label class="field"><span class="label">{{ $t('sona.species') }}</span><input v-model="draft.species" class="input" maxlength="40"></label>
        <label class="field"><span class="label">{{ $t('sona.pronouns') }}</span><input v-model="draft.pronouns" class="input" maxlength="30" :placeholder="$t('profile.pronounsHint')"></label>
        <label class="field"><span class="label">{{ $t('sona.about') }}</span><textarea v-model="draft.about" class="input" rows="3" maxlength="400" /></label>
        <label class="field"><span class="label">{{ $t('sona.traits') }}</span><input v-model="draft.traits" class="input" maxlength="160"></label>

        <fieldset class="sona__fieldset">
          <legend class="label">{{ $t('sona.colors') }}</legend>
          <div v-for="(c, i) in draft.palette" :key="i" class="sona__color-row">
            <input v-model="c.hex" type="color" class="sona__color-input" :aria-label="`${$t('sona.colorValue')} ${i + 1}`">
            <input v-model="c.name" class="input" maxlength="20" :placeholder="$t('sona.colorName')" :aria-label="`${$t('sona.colorName')} ${i + 1}`">
            <button type="button" class="sona__remove" :aria-label="$t('sona.removeColor', { n: i + 1 })" @click="draft.palette.splice(i, 1)">✕</button>
          </div>
          <button v-if="draft.palette.length < MAX_SONA_COLORS" type="button" class="btn btn--ghost" @click="addColor">+ {{ $t('sona.addColor') }}</button>
        </fieldset>

        <label class="field"><span class="label">{{ $t('sona.yes') }}</span><textarea v-model="draft.yesText" class="input" rows="3" :placeholder="$t('sona.yesHint')" /></label>
        <label class="field"><span class="label">{{ $t('sona.no') }}</span><textarea v-model="draft.noText" class="input" rows="3" :placeholder="$t('sona.noHint')" /></label>

        <label v-if="approved.length > 1" class="field">
          <span class="label">{{ $t('sona.refPick') }}</span>
          <select v-model="draft.refPhotoId" class="input">
            <option :value="null">{{ $t('sona.refAuto') }}</option>
            <option v-for="(p, i) in approved" :key="p.id" :value="p.id">#{{ i + 1 }}{{ p.credit ? ` · ${p.credit.text}` : '' }}</option>
          </select>
        </label>

        <p v-if="error" class="sona__error" role="alert">{{ error }}</p>
        <div class="sona__actions">
          <button type="submit" class="btn btn--primary" :disabled="saving">{{ $t('sona.save') }}</button>
          <button type="button" class="btn btn--ghost" @click="editing = false">{{ $t('sona.cancel') }}</button>
        </div>
      </form>
    </div>
    <PhotoViewer v-model="viewing" :photos="viewerPhotos" />
  </article>
</template>

<style lang="scss" scoped>
// Organismo: scheda del personaggio
.sona {
  @include card(10px, $radius-xl);
  @include stack($space-6);

  &__ref { position: relative; }

  // Stesse proporzioni delle versioni: 3:4 sul telefono, 3:2 da 760px in su (come in photoSources)
  &__ref-img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: $radius-lg;
    background: var(--bg);

    @include mq(md) { aspect-ratio: 3 / 2; }
  }

  &__ref-credit {
    position: absolute;
    left: 10px;
    bottom: 10px;
    @include pill(4px, 10px);
    background: var(--surface);
    color: var(--ink);
    font-size: 13px;
    font-weight: 800;
  }

  &__ref-open {
    position: absolute;
    right: 10px;
    bottom: 10px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--ink);
    color: var(--surface);
    display: grid;
    place-items: center;
    cursor: pointer;

    svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
  }

  &__body { @include stack($space-6); padding: 0 6px 8px; }

  &__head { display: flex; align-items: center; justify-content: space-between; gap: $space-4; flex-wrap: wrap; }

  &__name {
    margin: 0;
    font-size: 26px;

    &--small { font-size: 20px; }
  }

  &__about { margin: 0; font-size: 16px; line-height: 1.5; white-space: pre-line; }

  &__facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: $space-3 $space-7;
    margin: 0;
    font-size: 15px;

    dt { color: var(--muted); font-weight: 700; }

    dd { margin: 0; font-weight: 800; overflow-wrap: anywhere; }
  }

  &__block { @include stack($space-3); }

  &__label { margin: 0; font-size: 15px; font-weight: 800; font-family: var(--body); }

  &__palette {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    gap: $space-3;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__swatch {
    width: 100%;
    border: 0;
    padding: 0;
    background: none;
    color: var(--ink);
    display: flex;
    flex-direction: column;
    gap: 3px;
    cursor: pointer;
    text-align: center;
  }

  &__chip { height: 44px; border-radius: 12px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 18%, transparent); }

  &__swatch-name { font-size: 12px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__swatch-hex { font-size: 12px; font-weight: 700; color: var(--muted); font-family: ui-monospace, monospace; }

  &__rules { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: $space-4; }

  &__rule {
    @include stack($space-2);
    padding: 12px;
    border-radius: $radius-md;

    ul { margin: 0; padding-left: 18px; font-size: 15px; line-height: 1.5; }

    &--yes { background: color-mix(in srgb, var(--mint) 14%, var(--surface)); }

    &--no { background: color-mix(in srgb, var(--heart) 12%, var(--surface)); }
  }

  &__rule-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;
    font-weight: 900;

    svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  }

  &__empty, &__status { margin: 0; color: var(--muted); font-size: 14px; font-weight: 700; }

  &__edit { align-self: flex-start; }

  &__form { @include stack($space-6); }

  &__fieldset { border: 0; margin: 0; padding: 0; @include stack($space-3); }

  &__color-row { display: flex; align-items: center; gap: $space-3; }

  &__color-input { width: 48px; height: 44px; padding: 2px; border: 2px solid var(--line); border-radius: 12px; background: var(--surface); flex-shrink: 0; cursor: pointer; }

  &__remove {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--bg);
    color: var(--ink);
    font-weight: 900;
    cursor: pointer;
  }

  &__error { margin: 0; color: var(--action); font-weight: 800; }

  &__actions { @include cluster($space-3); }
}
</style>
