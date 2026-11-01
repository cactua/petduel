<script setup lang="ts">
import site from '#site'
import { photoCreditSchema, type ChallengeDetail, type Profile } from '#shared/models'
import type { Crops } from '#shared/images'

const props = defineProps<{ challenge: ChallengeDetail }>()
const emit = defineEmits<{ joined: [] }>()

const route = useRoute()
const { loggedIn, user } = useUserSession()
const { data: profile } = useLazyFetch<Profile>(() => `/api/users/${user.value?.username}`, {
  immediate: !!user.value,
  server: false,
})

const { t } = useI18n()

// Pet che possono ancora iscriversi: specie giusta e non già in gara
const eligible = computed(() => {
  const entered = new Set(props.challenge.myEntries.map(e => e.petId))
  return (profile.value?.pets ?? []).filter(p =>
    !entered.has(p.id) && !p.adoptionInfo?.hideFromRankings && (!props.challenge.species || p.species === props.challenge.species)
    && (!props.challenge.adoptionOnly || p.adoption === 'available' || p.adoption === 'fostered'))
})

const petId = ref<number | null>(null)
const mode = ref<'gallery' | 'new'>('gallery')
const photoId = ref<number | null>(null)
const file = ref<File | null>(null)
const preview = ref('')
const crops = ref<Crops | null>(null)
// Artista dell'immagine nuova, sui siti che lo chiedono
const credit = reactive({ credit: '', creditUrl: '' })
const sending = ref(false)
const error = ref('')

watch(eligible, (list) => {
  if (!list.some(p => p.id === petId.value)) petId.value = list[0]?.id ?? null
}, { immediate: true })

const pet = computed(() => eligible.value.find(p => p.id === petId.value))
const approvedPhotos = computed(() => pet.value?.photos.filter(p => p.status === 'approved') ?? [])
watch(pet, () => {
  photoId.value = null
  mode.value = approvedPhotos.value.length ? 'gallery' : 'new'
})

function setFile(f: File | null) {
  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = f
  preview.value = f ? URL.createObjectURL(f) : ''
  error.value = ''
}
const onFile = (e: Event) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))

// Incollare o trascinare una foto passa in automatico a "Foto nuova"
const { dragging, canRead, readClipboard } = usePhotoPaste((f) => {
  mode.value = 'new'
  setFile(f)
}, () => !!petId.value)
async function pasteButton() {
  error.value = await readClipboard()
}

async function submit() {
  error.value = ''
  if (!petId.value) return
  let body: FormData | { petId: number, photoId: number }
  if (mode.value === 'gallery') {
    if (!photoId.value) {
      error.value = t('join.pickPhoto')
      return
    }
    body = { petId: petId.value, photoId: photoId.value }
  }
  else {
    if (!file.value) {
      error.value = t('join.pickPhoto')
      return
    }
    body = new FormData()
    body.append('petId', String(petId.value))
    if (site.askCredit) {
      const check = photoCreditSchema.safeParse(credit)
      if (!check.success) {
        error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
        return
      }
      body.append('credit', check.data.credit)
      body.append('creditUrl', check.data.creditUrl)
    }
    body.append('photo', file.value)
    if (crops.value) body.append('crops', JSON.stringify(crops.value))
  }

  sending.value = true
  try {
    await $fetch(`/api/challenges/${props.challenge.slug}/entries`, { method: 'POST', body })
    // Si riparte puliti per iscrivere un altro pet
    setFile(null)
    crops.value = null
    Object.assign(credit, { credit: '', creditUrl: '' })
    photoId.value = null
    emit('joined')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="challenge-join">
    <div v-if="!loggedIn" class="challenge-join__box">
      <p class="challenge-join__text">{{ $t('join.needAccount') }}</p>
      <NuxtLink :to="{ path: '/accedi', query: { redirect: route.fullPath } }" class="btn btn--primary btn--lg">{{ $t('join.loginOrRegister') }}</NuxtLink>
    </div>

    <template v-else>
      <div v-if="challenge.myEntries.length" class="challenge-join__mine">
        <h3 class="challenge-join__title">{{ $t('join.yourEntries') }}</h3>
        <div v-for="e in challenge.myEntries" :key="e.entryId" class="challenge-join__entry" :class="`challenge-join__entry--${e.status}`">
          <picture v-if="e.image"><source v-for="s in photoSources(e.image, 'v', '44px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="e.image" :alt="e.petName" class="challenge-join__entry-img"></picture>
          <div>
            <b>{{ e.petName }}</b>
            <small class="challenge-join__entry-status">{{ $t(`join.status.${e.status}`) }}</small>
          </div>
          <ShareCard
            v-if="e.status === 'approved'" :pet-id="e.petId" :pet-name="e.petName" :sfida="challenge.slug"
            :label="$t('join.askVotes')" class="challenge-join__share"
          />
        </div>
      </div>

      <form v-if="eligible.length" class="challenge-join__box" @submit.prevent="submit">
        <h3 class="challenge-join__title">{{ $t('join.title') }}</h3>
        <label for="join-pet" class="label">{{ $t('join.pet') }}</label>
        <select id="join-pet" v-model="petId" class="input">
          <option v-for="p in eligible" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>

        <div class="challenge-join__modes" role="radiogroup" :aria-label="$t('join.whichPhoto')">
          <button type="button" class="challenge-join__mode" :class="{ 'is-active': mode === 'gallery' }" :disabled="!approvedPhotos.length" @click="mode = 'gallery'">{{ $t('join.fromGallery') }}</button>
          <button type="button" class="challenge-join__mode" :class="{ 'is-active': mode === 'new' }" @click="mode = 'new'">{{ $t('join.newPhoto') }}</button>
        </div>

        <div v-if="mode === 'gallery'" class="challenge-join__pick">
          <button
            v-for="ph in approvedPhotos" :key="ph.id" type="button" class="challenge-join__thumb"
            :class="{ 'is-active': photoId === ph.id }" :aria-pressed="photoId === ph.id" @click="photoId = ph.id"
          >
            <picture><source v-for="s in photoSources(ph.image, 'v', '(min-width: 760px) 110px, 30vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="ph.image" :alt="$t('join.galleryPhoto')" class="challenge-join__thumb-img"></picture>
          </button>
        </div>
        <template v-else>
          <PhotoCropper v-if="preview" v-model="crops" :src="preview" />
          <div class="challenge-join__upload" :class="{ 'challenge-join__upload--change': preview }">
            <label class="challenge-join__drop" :class="{ 'challenge-join__drop--change': preview, 'is-dragging': dragging }">
              <span v-if="preview">{{ $t('upload.change') }}</span>
              <span v-else>{{ $t('join.pickThemed') }}<br><small>{{ $t('join.pickThemedHelp') }}</small></span>
              <input id="join-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" class="u-visually-hidden" @change="onFile">
            </label>
            <button v-if="canRead" type="button" class="btn btn--ghost" @click="pasteButton">📋 {{ $t('upload.paste') }}</button>
          </div>
          <CreditFields v-if="site.askCredit" v-model="credit" />
        </template>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg" :disabled="sending">{{ sending ? $t('common.sending') : $t('join.submit') }}</button>
      </form>

      <div v-else-if="profile && !challenge.myEntries.length" class="challenge-join__box">
        <p v-if="challenge.adoptionOnly" class="challenge-join__text">{{ $t('join.onlyShelters') }}</p>
        <p v-else-if="challenge.species" class="challenge-join__text">{{ $t('join.onlySpecies') }}</p>
        <p v-else class="challenge-join__text">{{ $t('join.uploadFirst') }}</p>
        <NuxtLink to="/carica" class="btn btn--primary btn--lg">{{ $t('join.uploadPet') }}</NuxtLink>
      </div>
      <p v-else-if="profile" class="challenge-join__done">{{ $t('join.allIn') }} 🍀</p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: iscrizione di un pet a una sfida
.challenge-join {
  @include stack($space-6);
  max-width: 520px;
  width: 100%;
  margin: 0 auto;

  &__box { @include card($space-7, 24px); @include stack($space-3); }

  &__text { margin: 0; color: var(--muted); }

  &__title { font-size: 18px; }

  &__modes { display: flex; background: var(--bg); border-radius: $radius-pill; padding: $space-1; }

  &__mode {
    flex: 1;
    border: 0;
    background: none;
    padding: $space-3;
    border-radius: $radius-pill;
    font-weight: 700;
    color: var(--muted);
    cursor: pointer;

    &.is-active { background: var(--sun); color: var(--sun-ink); }

    &:disabled { opacity: .4; cursor: not-allowed; }
  }

  &__pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: $space-2; }

  &__thumb {
    padding: 0;
    border: 3px solid transparent;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    background: none;
    aspect-ratio: 3 / 4;

    &.is-active { border-color: var(--coral); }
  }

  &__thumb-img { width: 100%; height: 100%; object-fit: cover; }

  &__upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;

    &--change { flex-direction: row; justify-content: center; flex-wrap: wrap; }
  }

  &__drop {
    aspect-ratio: 3 / 4;
    max-height: 36vh;
    max-width: 100%;
    align-self: center;
    border: 2px dashed var(--line);
    border-radius: $radius-md;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--muted);
    padding: $space-6;
    cursor: pointer;
    font-weight: 600;

    small { font-weight: 400; }

    &--change { aspect-ratio: auto; padding: 10px 18px; border-radius: $radius-pill; font-weight: 800; color: var(--coral); }

    &.is-dragging { border-color: var(--coral); background: var(--coral-soft); }
  }

  &__mine { @include stack($space-2); }

  &__entry {
    display: flex;
    align-items: center;
    gap: $space-4;
    background: var(--surface);
    border-radius: $radius-md;
    padding: $space-3;
    box-shadow: $shadow-flat;
  }

  &__entry-img { width: 44px; height: 58px; object-fit: cover; border-radius: 12px; }

  &__entry-status {
    display: block;
    color: var(--muted);

    .challenge-join__entry--approved & { color: var(--mint); font-weight: 700; }

    .challenge-join__entry--rejected & { color: var(--coral); font-weight: 700; }
  }

  &__share { margin-left: auto; }

  &__done { text-align: center; color: var(--muted); }
}
</style>
