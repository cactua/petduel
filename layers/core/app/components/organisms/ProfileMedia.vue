<script setup lang="ts">
import { IMAGE_VARIANTS, PROFILE_IMAGES, centeredCrop, profileImageSources, variantName, type Crop, type Crops, type ProfileImageKind } from '#shared/images'
import type { Profile } from '#shared/models'

/**
 * Banner e avatar del profilo. Sul proprio profilo, passando sopra (o sempre, sui telefoni) compare
 * l'icona per cambiarli: si modifica sul posto, trascinando l'immagine nella cornice, scegliendo tra le
 * proprie immagini o caricandone una nuova (che va in revisione come le altre).
 */
const props = defineProps<{ profile: Profile }>()
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const uid = useId()

const banner = computed(() => props.profile.banner ? profileImageSources(props.profile.banner.id, 'banner', '(min-width: 1040px) 1000px, 100vw') : null)
const avatar = computed(() => props.profile.avatar ? profileImageSources(props.profile.avatar.id, 'avatar', '92px') : null)
const letter = computed(() => props.profile.username[0]?.toUpperCase() ?? '')

// Immagini tra cui scegliere: quelle dei propri personaggi non rifiutate, le più recenti prima
const choices = computed(() => props.profile.pets
  .flatMap(p => p.photos.filter(ph => ph.status !== 'rejected' && ph.image).map(ph => ({ id: ph.id, image: ph.image!, pet: p.name, pending: ph.status === 'pending', at: ph.createdAt })))
  .sort((a, b) => b.at.localeCompare(a.at)))

type Choice = { type: 'photo', id: number } | { type: 'file', file: File, url: string } | { type: 'none' }
const editing = ref<ProfileImageKind | null>(null)
const choice = ref<Choice>({ type: 'none' })
const crop = ref<Crop | null>(null)
const zoom = ref(1)
const initial = ref<Crop | null>(null)
const fileSize = ref<{ w: number, h: number } | null>(null)
const targetPet = ref<number | null>(null)
const saving = ref(false)
const error = ref('')

function setChoice(next: Choice) {
  if (choice.value.type === 'file') URL.revokeObjectURL(choice.value.url)
  choice.value = next
  initial.value = null
  zoom.value = 1
}
onBeforeUnmount(() => setChoice({ type: 'none' }))

function start(kind: ProfileImageKind) {
  const current = props.profile[kind]
  setChoice(current && choices.value.some(c => c.id === current.photoId) ? { type: 'photo', id: current.photoId } : { type: 'none' })
  initial.value = current?.crop ?? null
  targetPet.value = props.profile.pets[0]?.id ?? null
  error.value = ''
  editing.value = kind
  // La cornice prende il fuoco: chi usa la tastiera può subito spostare l'immagine con le frecce
  nextTick(() => document.getElementById(`${uid}-panel`)?.focus())
}
function cancel() {
  const kind = editing.value
  setChoice({ type: 'none' })
  editing.value = null
  nextTick(() => document.getElementById(`${uid}-edit-${kind}`)?.focus())
}

// Cosa si vede nella cornice: la variante già inquadrata della foto scelta, o il file appena preso
const frameSrc = computed(() => {
  const c = choice.value
  if (!editing.value || c.type === 'none') return null
  if (c.type === 'file') return c.url
  const photo = choices.value.find(p => p.id === c.id)
  const { from, fromWidth } = PROFILE_IMAGES[editing.value]
  return photo ? variantName(photo.image, from, fromWidth, 'webp') : null
})

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  fileSize.value = null
  setChoice({ type: 'file', file, url: URL.createObjectURL(file) })
}

/**
 * Nuova immagine: si carica come foto del personaggio scelto (fuori dai duelli) con i ritagli del sito
 * costruiti attorno alla parte scelta, poi l'avatar o il banner si ritaglia dalla variante giusta.
 */
async function uploadFile(file: File, kind: ProfileImageKind, picked: Crop) {
  const s = fileSize.value!
  const crops = Object.fromEntries((['v', 'h', 's'] as const).map(v => [v, centeredCrop(s.w, s.h, IMAGE_VARIANTS[v].ratio)])) as Crops
  let inner: Crop = { x: 0, y: 0, w: 1, h: 1 }
  if (kind === 'avatar') crops.s = picked
  else {
    // Il riquadro 3:2 più grande possibile, centrato sulla fascia scelta: il banner si ritaglia dentro questo
    const h = crops.h
    const x = Math.min(Math.max(picked.x + picked.w / 2 - h.w / 2, 0), 1 - h.w)
    const y = Math.min(Math.max(picked.y + picked.h / 2 - h.h / 2, 0), 1 - h.h)
    crops.h = { x, y, w: h.w, h: h.h }
    inner = {
      x: Math.max(0, (picked.x - x) / h.w), y: Math.max(0, (picked.y - y) / h.h),
      w: Math.min(1, picked.w / h.w), h: Math.min(1, picked.h / h.h),
    }
  }
  const body = new FormData()
  body.append('photo', await shrinkImage(file))
  body.append('crops', JSON.stringify(crops))
  body.append('inDuels', 'false')
  const res = await $fetch<{ photoId: number }>(`/api/pets/${targetPet.value}/photos`, { method: 'POST', body })
  return { photoId: res.photoId, crop: inner }
}

async function save() {
  const kind = editing.value
  if (!kind) return
  error.value = ''
  saving.value = true
  try {
    const c = choice.value
    let body: { kind: ProfileImageKind, photoId: number | null, crop?: Crop } = { kind, photoId: null }
    if (c.type !== 'none') {
      if (!crop.value) return
      body = c.type === 'photo'
        ? { kind, photoId: c.id, crop: crop.value }
        : { kind, ...(await uploadFile(c.file, kind, crop.value)) }
    }
    await $fetch('/api/me/profile-image', { method: 'PUT', body })
    // Anche il menu e la barra in basso mostrano subito il nuovo avatar
    if (kind === 'avatar') refreshNuxtData(MY_AVATAR_KEY)
    setChoice({ type: 'none' })
    editing.value = null
    emit('saved')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    saving.value = false
  }
}

const frameLabel = computed(() => t('profile.media.frame'))
const showBanner = computed(() => !!props.profile.banner || props.profile.isMe)
</script>

<template>
  <div class="profile-media" :class="{ 'profile-media--banner': showBanner, 'is-editing': editing }">
    <!-- Banner: immagine larga in cima; al proprietario senza banner un invito a metterlo -->
    <div v-if="showBanner || editing === 'banner'" class="profile-media__banner" :class="{ 'is-empty': !banner, 'is-framing': editing === 'banner' }">
      <CropFrame
        v-if="editing === 'banner' && frameSrc" v-model:crop="crop" v-model:zoom="zoom" :src="frameSrc"
        :ratio="PROFILE_IMAGES.banner.ratio" :initial="initial" :label="frameLabel" @size="fileSize = $event"
      />
      <picture v-else-if="banner && editing !== 'banner'">
        <source v-for="s in banner.sources" :key="s.type" v-bind="s">
        <img :src="banner.src" alt="" class="profile-media__img">
      </picture>
      <span v-if="profile.isMe && profile.banner?.pending && !editing" class="profile-media__pending">{{ $t('profile.media.pending') }}</span>
      <button
        v-if="profile.isMe && !editing" :id="`${uid}-edit-banner`" type="button" class="profile-media__edit profile-media__edit--banner"
        :aria-label="$t('profile.media.editBanner')" :title="$t('profile.media.editBanner')" @click="start('banner')"
      >
        <AppIcon name="camera" /><span v-if="!banner" class="profile-media__edit-text">{{ $t('profile.media.addBanner') }}</span>
      </button>
    </div>

    <div class="profile-media__row">
      <span class="profile-media__avatar" :class="{ 'is-raised': showBanner, 'is-big': editing === 'avatar' }">
        <CropFrame
          v-if="editing === 'avatar' && frameSrc" v-model:crop="crop" v-model:zoom="zoom" :src="frameSrc"
          :ratio="1" :initial="initial" :label="frameLabel" @size="fileSize = $event"
        />
        <picture v-else-if="avatar && editing !== 'avatar'">
          <source v-for="s in avatar.sources" :key="s.type" v-bind="s">
          <img :src="avatar.src" alt="" class="profile-media__img">
        </picture>
        <span v-else class="profile-media__letter" aria-hidden="true">{{ letter }}</span>
        <button
          v-if="profile.isMe && !editing" :id="`${uid}-edit-avatar`" type="button" class="profile-media__edit profile-media__edit--avatar"
          :aria-label="$t('profile.media.editAvatar')" :title="$t('profile.media.editAvatar')" @click="start('avatar')"
        >
          <AppIcon name="camera" />
        </button>
      </span>
      <slot />
    </div>
    <p v-if="profile.isMe && profile.avatar?.pending && !editing" class="profile-media__note">{{ $t('profile.media.pendingAvatar') }}</p>

    <!-- Pannello di modifica, sotto la testata: niente finestre sopra la pagina -->
    <section v-if="editing" :id="`${uid}-panel`" class="profile-media__panel" tabindex="-1" :aria-label="editing === 'avatar' ? $t('profile.media.editAvatar') : $t('profile.media.editBanner')">
      <div v-if="frameSrc" class="profile-media__zoom">
        <label :for="`${uid}-zoom`" class="label">{{ $t('profile.media.zoom') }}</label>
        <input :id="`${uid}-zoom`" v-model.number="zoom" type="range" min="1" max="4" step="0.01" class="profile-media__slider">
        <small class="hint">{{ $t('profile.media.dragHint') }}</small>
      </div>

      <fieldset class="profile-media__choices">
        <legend class="label">{{ $t('profile.media.pick') }}</legend>
        <div class="profile-media__strip">
          <label class="profile-media__tile profile-media__tile--upload" :class="{ 'is-active': choice.type === 'file', 'is-disabled': !profile.pets.length }">
            <input type="file" accept="image/*" class="u-visually-hidden" :disabled="!profile.pets.length" @change="onFile">
            <span aria-hidden="true" class="profile-media__plus">+</span>
            <span class="profile-media__tile-text">{{ $t('profile.media.upload') }}</span>
          </label>
          <label class="profile-media__tile profile-media__tile--none" :class="{ 'is-active': choice.type === 'none' }">
            <input type="radio" :name="`${uid}-pick`" class="u-visually-hidden" :checked="choice.type === 'none'" @change="setChoice({ type: 'none' })">
            <span v-if="editing === 'avatar'" class="profile-media__mini-letter" aria-hidden="true">{{ letter }}</span>
            <span class="profile-media__tile-text">{{ editing === 'avatar' ? $t('profile.media.letter') : $t('profile.media.none') }}</span>
          </label>
          <label v-for="c in choices" :key="c.id" class="profile-media__tile" :class="{ 'is-active': choice.type === 'photo' && choice.id === c.id }">
            <input type="radio" :name="`${uid}-pick`" class="u-visually-hidden" :checked="choice.type === 'photo' && choice.id === c.id" @change="setChoice({ type: 'photo', id: c.id })">
            <picture><source v-for="s in photoSources(c.image, 's', '72px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="c.image" :alt="c.pending ? $t('profile.media.pendingAlt', { name: c.pet }) : $t('pet.photoOf', { name: c.pet })" loading="lazy" class="profile-media__img"></picture>
            <span v-if="c.pending" class="profile-media__tile-badge" aria-hidden="true">⏳</span>
          </label>
        </div>
      </fieldset>
      <p v-if="!profile.pets.length" class="hint">
        {{ $t('profile.media.needCharacter') }} <NuxtLink to="/upload" class="profile-media__link">{{ $t('profile.newPet') }}</NuxtLink>
      </p>

      <div v-if="choice.type === 'file'" class="profile-media__file">
        <label v-if="profile.pets.length > 1" class="profile-media__pet">
          <span class="label">{{ $t('profile.media.addTo') }}</span>
          <select v-model="targetPet" class="input">
            <option v-for="p in profile.pets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <small class="hint">{{ $t('profile.media.reviewHint') }}</small>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="profile-media__buttons">
        <button type="button" class="btn btn--ghost" @click="cancel">{{ $t('common.cancel') }}</button>
        <button type="button" class="btn btn--primary" :disabled="saving || (choice.type !== 'none' && !crop)" @click="save">
          {{ saving ? $t('auth.wait') : $t('common.save') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: banner e avatar del profilo, con la modifica sul posto per il proprietario
.profile-media {
  @include stack($space-4);

  &__banner {
    position: relative;
    margin: -18px -18px 0;
    aspect-ratio: 4 / 1;
    max-height: 240px;
    width: calc(100% + 36px);
    overflow: hidden;
    background: linear-gradient(135deg, var(--coral-soft), color-mix(in srgb, var(--coral-soft) 40%, var(--bg)));

    // Senza banner, al proprietario basta una fascia bassa con l'invito
    &.is-empty:not(.is-framing) { aspect-ratio: auto; height: 88px; }
  }

  &__img { width: 100%; height: 100%; object-fit: cover; display: block; }

  // Se non c'è spazio (avatar grande in modifica, telefoni) il nome va sotto l'avatar
  &__row { display: flex; flex-wrap: wrap; align-items: center; gap: $space-3 $space-6; min-width: 0; }

  &__row > :slotted(*) { flex: 1 1 180px; min-width: 0; }

  .profile-media--banner &__row { align-items: flex-start; }

  &__avatar {
    position: relative;
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--action);
    color: #fff;
    font-family: var(--display);
    font-size: 30px;
    font-weight: 700;

    > picture, > .crop-frame { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; }

    &.is-raised { width: 92px; height: 92px; margin-top: -46px; font-size: 40px; box-shadow: 0 0 0 4px var(--surface); }

    // In modifica l'avatar si ingrandisce per ritagliarlo con precisione
    &.is-big { width: 156px; height: 156px; }

    .profile-media__img { border-radius: 50%; }
  }

  &__letter { line-height: 1; }

  // Icona per cambiare: compare passando sopra o con il fuoco; sui telefoni (niente hover) resta visibile
  &__edit {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
    padding: 0 12px;
    border: 0;
    border-radius: $radius-pill;
    background: rgba(20, 12, 6, .72);
    color: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    opacity: 0;
    transition: opacity .15s;

    :deep(svg) { width: 20px; height: 20px; }

    &:focus-visible { opacity: 1; outline: 3px solid var(--ink); outline-offset: 2px; }

    @media (hover: none) { opacity: 1; }

    &--banner { right: 12px; bottom: 12px; }

    &--avatar { right: -6px; bottom: -6px; padding: 0; box-shadow: 0 0 0 3px var(--surface); }
  }

  &__banner:hover &__edit, &__avatar:hover &__edit { opacity: 1; }

  // Senza banner l'invito resta sempre visibile, al centro
  &__banner.is-empty &__edit--banner { opacity: 1; inset: 50% auto auto 50%; transform: translate(-50%, -50%); }

  &__pending {
    position: absolute;
    left: 12px;
    bottom: 12px;
    @include pill(4px, 10px);
    background: rgba(20, 12, 6, .72);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
  }

  &__note { margin: -6px 0 0; color: var(--muted); font-size: 13px; font-weight: 700; }

  &__panel {
    @include stack($space-4);
    padding: 14px;
    border-radius: $radius-md;
    background: var(--bg);

    &:focus { outline: none; }
  }

  &__zoom { @include stack($space-1); }

  &__slider { width: 100%; min-height: 44px; accent-color: var(--action); }

  &__choices { border: 0; margin: 0; padding: 0; @include stack($space-2); min-width: 0; }

  // Una sola riga che scorre di lato: niente griglie che vanno a capo
  &__strip {
    display: flex;
    gap: $space-2;
    overflow-x: auto;
    padding: 5px 5px 8px;
    margin: -5px;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
  }

  &__tile {
    position: relative;
    flex: 0 0 72px;
    height: 72px;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    background: var(--line);
    scroll-snap-align: start;
    outline: 3px solid transparent;
    outline-offset: 2px;

    &.is-active { outline-color: var(--action); }

    &:has(:focus-visible) { outline-color: var(--ink); }

    &--upload, &--none {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 4px;
      text-align: center;
      background: var(--surface);
      border: 2px dashed var(--line);
    }

    &--upload { border-color: var(--action); color: var(--coral-deep); }

    &.is-disabled { opacity: .5; cursor: not-allowed; }
  }

  &__plus { font-size: 24px; font-weight: 900; line-height: 1; }

  &__tile-text { font-size: 11px; font-weight: 800; line-height: 1.15; }

  &__mini-letter {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--action);
    color: #fff;
    font-family: var(--display);
    font-weight: 700;
  }

  &__tile-badge { position: absolute; top: 3px; left: 3px; font-size: 13px; }

  &__file { @include stack($space-2); }

  &__pet { @include stack($space-1); max-width: 320px; }

  &__link { color: var(--coral-deep); font-weight: 900; }

  &__buttons { @include cluster($space-3); justify-content: flex-end; }
}
</style>
