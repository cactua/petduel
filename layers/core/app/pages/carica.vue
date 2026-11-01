<script setup lang="ts">
import { NO_SPECIES, SPECIES, SPECIES_EMOJI, petFieldsSchema, type PetGallery, type Profile, type Species } from '#shared/models'
import type { Crops } from '#shared/images'

definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => `${t('nav.upload')} · PetDuel` })

const route = useRoute()
const { user } = useUserSession()
const { data: profile, refresh: refreshProfile } = await useFetch<Profile>(() => `/api/users/${user.value!.username}`)

// "new" = nuovo pet, altrimenti l'id di un pet esistente a cui aggiungere la foto
const target = ref<'new' | number>(Number(route.query.pet) || 'new')
const blankForm = () => ({ name: '', species: (SPECIES[0] ?? NO_SPECIES) as Species, breed: '', city: '' })
const form = reactive(blankForm())
const photo = ref<File | null>(null)
const preview = ref('')
const crops = ref<Crops | null>(null)
const sending = ref(false)
const error = ref('')
const done = ref(false)

watchEffect(() => {
  if (profile.value && target.value !== 'new' && !profile.value.pets.some(p => p.id === target.value)) target.value = 'new'
})

// Miniatura del pet nella scelta: la prima foto approvata, altrimenti la più recente
const thumb = (p: PetGallery) => p.photos.find(ph => ph.status === 'approved')?.image ?? p.photos[0]?.image
const targetPet = computed(() => profile.value?.pets.find(p => p.id === target.value))

function setPhoto(file: File | null) {
  if (preview.value) URL.revokeObjectURL(preview.value)
  photo.value = file
  preview.value = file ? URL.createObjectURL(file) : ''
  error.value = ''
}
const onFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  setPhoto(input.files?.[0] ?? null)
  input.value = '' // così si può riscegliere lo stesso file
}
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))

// La foto si può anche incollare (Ctrl+V o pulsante) o trascinare sulla pagina
const { dragging, canRead, readClipboard } = usePhotoPaste(setPhoto, () => !done.value)
async function pasteButton() {
  error.value = await readClipboard()
}

async function submit() {
  error.value = ''
  if (!photo.value) {
    error.value = t('join.pickPhoto')
    return
  }
  const body = new FormData()
  if (target.value === 'new') {
    const check = petFieldsSchema.safeParse(form)
    if (!check.success) {
      error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
      return
    }
    Object.entries(check.data).forEach(([k, v]) => body.append(k, v))
  }
  body.append('photo', photo.value)
  if (crops.value) body.append('crops', JSON.stringify(crops.value))

  sending.value = true
  try {
    await $fetch(target.value === 'new' ? '/api/pets' : `/api/pets/${target.value}/photos`, { method: 'POST', body })
    done.value = true
  }
  catch (e) {
    error.value = errorMessage(e, 'upload.failed')
  }
  finally {
    sending.value = false
  }
}

// Si ricomincia da zero: modulo vuoto, e il pet appena creato compare tra quelli già esistenti
function again() {
  done.value = false
  setPhoto(null)
  crops.value = null
  Object.assign(form, blankForm())
  refreshProfile()
}
</script>

<template>
  <section class="upload-page">
    <div v-if="done" class="upload-page__done">
      <span class="upload-page__done-icon" aria-hidden="true">🎉</span>
      <h1 class="upload-page__done-title">{{ $t('upload.sent') }}</h1>
      <p class="upload-page__done-text">{{ $t('upload.sentHelp') }}</p>
      <NuxtLink :to="`/u/${user!.username}`" class="btn btn--primary btn--lg">{{ $t('upload.toProfile') }}</NuxtLink>
      <button type="button" class="btn btn--ghost btn--lg" @click="again">{{ $t('upload.another') }}</button>
    </div>

    <!-- Su telefono una colonna: per quale pet, la foto, i dati del nuovo pet.
         Su computer la foto va a sinistra e il resto in una card a destra.
         I numeri dei passi li mette il CSS, così restano in ordine anche quando un blocco manca -->
    <form v-else class="upload-page__form" @submit.prevent="submit">
      <header class="upload-page__intro">
        <h1 class="upload-page__title">{{ $t('nav.uploadPhoto') }}</h1>
        <p class="upload-page__lead">{{ $t('upload.intro') }}</p>
      </header>

      <div v-if="profile?.pets.length" class="upload-page__col upload-page__col--who">
        <h2 id="who-title" class="upload-page__step-title"><span class="upload-page__step" /> {{ $t('upload.forWhich') }}</h2>
        <div class="upload-page__targets" role="radiogroup" aria-labelledby="who-title">
          <label v-for="p in profile.pets" :key="p.id" class="upload-page__option upload-page__option--target" :class="{ 'is-active': target === p.id }">
            <input v-model="target" type="radio" name="target" :value="p.id" class="upload-page__hidden-input">
            <img v-if="thumb(p)" :src="thumb(p)" alt="" class="upload-page__thumb">
            <span v-else class="upload-page__thumb upload-page__thumb--empty" aria-hidden="true">{{ SPECIES_EMOJI[p.species] ?? '🐾' }}</span>
            <b class="upload-page__target-name">{{ p.name }}</b>
          </label>
          <label class="upload-page__option upload-page__option--target" :class="{ 'is-active': target === 'new' }">
            <input v-model="target" type="radio" name="target" value="new" class="upload-page__hidden-input">
            <span class="upload-page__thumb upload-page__thumb--empty" aria-hidden="true">+</span>
            <b class="upload-page__target-name">{{ $t('upload.newPet') }}</b>
          </label>
        </div>
      </div>

      <div class="upload-page__col upload-page__col--photo">
        <h2 class="upload-page__step-title"><span class="upload-page__step" /> {{ $t('upload.stepPhoto') }}</h2>
        <!-- Scelta la foto, si decide come ritagliarla per ogni forma usata dal sito -->
        <template v-if="preview">
          <PhotoCropper v-model="crops" :src="preview" />
          <div class="upload-page__photo-actions">
            <label class="btn btn--ghost upload-page__file-btn">
              {{ $t('upload.change') }}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" class="upload-page__hidden-input" @change="onFile">
            </label>
            <button v-if="canRead" type="button" class="btn btn--ghost" @click="pasteButton">📋 {{ $t('upload.paste') }}</button>
            <button type="button" class="btn btn--ghost u-muted" @click="setPhoto(null)">{{ $t('upload.remove') }}</button>
          </div>
        </template>
        <div v-else class="upload-page__drop" :class="{ 'is-dragging': dragging }">
          <label class="upload-page__drop-area">
            <span class="upload-page__drop-icon" aria-hidden="true">📷</span>
            <b class="upload-page__drop-title upload-page__touch">{{ $t('upload.pick') }}</b>
            <b class="upload-page__drop-title upload-page__mouse">{{ $t('upload.drop') }}</b>
            <small class="upload-page__drop-help upload-page__touch">{{ $t('upload.pickHelp') }}</small>
            <small class="upload-page__drop-help upload-page__mouse">{{ $t('upload.dropHelp') }}</small>
            <span class="upload-page__browse">{{ $t('upload.browse') }}</span>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" class="upload-page__hidden-input" @change="onFile">
          </label>
          <button v-if="canRead" type="button" class="btn btn--ghost" @click="pasteButton">📋 {{ $t('upload.paste') }}</button>
        </div>
      </div>

      <div class="upload-page__col upload-page__col--details" :class="{ 'upload-page__col--alone': !profile?.pets.length }">
        <template v-if="target === 'new'">
          <h2 class="upload-page__step-title"><span class="upload-page__step" /> {{ $t('upload.stepDetails') }}</h2>
          <div class="field">
            <label for="name" class="label">{{ $t('pet.name') }}</label>
            <input id="name" v-model="form.name" required maxlength="40" placeholder="Biscotto" class="input upload-page__input">
          </div>

          <fieldset v-if="SPECIES.length" class="upload-page__species">
            <legend class="label upload-page__legend">{{ $t('pet.species') }}</legend>
            <label v-for="sp in SPECIES" :key="sp" class="upload-page__option" :class="{ 'is-active': form.species === sp }">
              <input v-model="form.species" type="radio" name="species" :value="sp" class="upload-page__hidden-input">
              <span aria-hidden="true">{{ SPECIES_EMOJI[sp] }}</span> {{ speciesText(sp, 'one') }}
            </label>
          </fieldset>

          <div class="upload-page__two">
            <div class="field">
              <label for="breed" class="label">{{ $t('pet.breed') }} <small>({{ $t('common.optional') }})</small></label>
              <input id="breed" v-model="form.breed" maxlength="40" placeholder="Beagle" class="input upload-page__input">
            </div>
            <div class="field">
              <label for="city" class="label">{{ $t('pet.city') }} <small>({{ $t('common.optional') }})</small></label>
              <input id="city" v-model="form.city" maxlength="40" :placeholder="$t('upload.cityPlaceholder')" class="input upload-page__input">
            </div>
          </div>
        </template>
        <p v-else-if="targetPet" class="upload-page__adding">{{ $t('upload.addTo', { name: targetPet.name }) }}</p>

        <p class="upload-page__rules">{{ $t('upload.rules') }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg btn--block" :disabled="sending">
          {{ sending ? $t('upload.uploading') : $t('upload.submit') }}
        </button>
      </div>
    </form>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: carica una foto (per un pet esistente o nuovo)
.upload-page {
  &__form {
    max-width: 460px;
    margin: 0 auto;
    @include stack($space-7);
    padding-bottom: 12px;
    counter-reset: step;

    // Computer: foto a sinistra, dati in una card a destra
    @include mq(lg) {
      max-width: 1000px;
      display: grid;
      gap: 0 32px;
      align-items: start;
      grid-template-columns: minmax(0, 1fr) 400px;
      grid-template-rows: auto auto 1fr;
      grid-template-areas: "intro intro" "photo who" "photo details";
    }
  }

  &__intro {
    @include mq(lg) { grid-area: intro; margin-bottom: 20px; }
  }

  &__title {
    font-size: 24px;
    margin: 0;

    @include mq(lg) { font-size: 30px; }
  }

  &__lead { margin: $space-1 0 0; color: var(--muted); font-size: 14px; }

  &__col {
    @include stack($space-5);
    min-width: 0;

    &--photo { @include mq(lg) { grid-area: photo; } }

    // "Per quale pet?" e i dati formano un'unica card
    &--who, &--details {
      @include mq(lg) { background: var(--surface); box-shadow: 0 16px 34px -22px var(--shadow); }
    }

    &--who { @include mq(lg) { grid-area: who; border-radius: 28px 28px 0 0; padding: 22px 22px 8px; } }

    &--details { @include mq(lg) { grid-area: details; align-self: start; gap: 16px; border-radius: 0 0 28px 28px; padding: 14px 22px 22px; } }

    &--alone { @include mq(lg) { border-radius: 28px; padding-top: 22px; } }
  }

  &__step-title { display: flex; align-items: center; gap: $space-3; margin: 0; font-size: 17px; }

  &__step {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--coral-soft);
    color: var(--coral);
    font-size: 14px;
    font-weight: 900;

    &::before { counter-increment: step; content: counter(step); }
  }

  &__input {
    padding: 12px 14px;
    background: var(--surface);

    @include mq(lg) { background: var(--bg); }
  }

  // Input nascosti ma raggiungibili da tastiera: si vede il contenitore che li avvolge
  &__hidden-input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }

  &__two { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: $space-5; }

  &__species { border: 0; margin: 0; padding: 0; min-width: 0; @include cluster($space-3); }

  &__legend { padding: 0; margin-bottom: $space-3; }

  // Foto non ancora scelta: area grande per toccare, cliccare o trascinare
  &__drop { display: flex; flex-direction: column; align-items: center; gap: $space-4; }

  &__drop-area {
    position: relative;
    width: 100%;
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    border: 2px dashed var(--line);
    border-radius: 24px;
    background: var(--surface);
    color: var(--muted);
    transition: border-color .15s, background .15s;

    &:hover { border-color: var(--coral); }

    &:has(input:focus-visible) { border-color: var(--coral); outline: 2px solid var(--coral); outline-offset: 3px; }

    .is-dragging > & { border-color: var(--coral); border-style: solid; background: var(--coral-soft); }

    @include mq(lg) { min-height: 440px; }
  }

  &__drop-icon { font-size: 40px; line-height: 1; margin-bottom: $space-1; }

  &__drop-title { color: var(--ink); font-size: 16px; }

  &__drop-help { font-size: 13px; max-width: 34ch; }

  &__browse { margin-top: 10px; background: var(--ink); color: var(--bg); @include pill(10px, 18px); font-weight: 800; font-size: 14px; }

  // Testi diversi per chi tocca e chi usa il mouse (dove si può trascinare)
  &__mouse { display: none; }

  @media (hover: hover) and (pointer: fine) {
    &__touch { display: none; }

    &__mouse { display: block; }
  }

  &__photo-actions { @include cluster($space-3); justify-content: center; }

  &__file-btn {
    position: relative;

    &:has(input:focus-visible) { border-color: var(--coral); }
  }

  // Scelta del pet e della specie: pillole al posto del menu a tendina
  &__targets { @include cluster($space-3); }

  &__option {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    @include pill(8px, 14px);
    cursor: pointer;
    border: 2px solid var(--line);
    background: var(--surface);
    font-weight: 700;
    font-size: 14px;

    @include mq(lg) { background: var(--bg); }

    &--target { gap: $space-3; padding: 5px 14px 5px 5px; max-width: 100%; }

    &:hover { border-color: var(--coral); }

    &.is-active, &.is-active:hover { border-color: var(--coral); background: var(--coral-soft); }

    &:has(input:focus-visible) { outline: 2px solid var(--coral); outline-offset: 2px; }
  }

  &__thumb {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;

    &--empty { display: grid; place-items: center; background: var(--bg); font-size: 18px; font-weight: 900; color: var(--coral); }
  }

  &__target-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__adding {
    margin: 0;
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--surface);
    color: var(--muted);
    font-size: 14px;

    @include mq(lg) { background: var(--bg); }
  }

  &__rules { font-size: 13px; color: var(--muted); margin: 0; }

  &__done { max-width: 460px; margin: 24px auto; @include stack($space-4); text-align: center; }

  &__done-icon { font-size: 48px; }

  &__done-title { margin: 0; }

  &__done-text { color: var(--muted); margin: 0 0 8px; }
}
</style>
