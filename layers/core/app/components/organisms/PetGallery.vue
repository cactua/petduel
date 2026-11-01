<script setup lang="ts">
import { HAS_BREED_CITY, SPECIES, petFieldsSchema, type PetGallery } from '#shared/models'
import { HEART_TIERS } from '#shared/badges'

const props = defineProps<{ pet: PetGallery, editable?: boolean, linkTitle?: boolean, hero?: boolean }>()
const emit = defineEmits<{ changed: [], deleted: [] }>()

// Copertina: l'ultima foto pubblica (o, per il proprietario, l'ultima che ha caricato)
const cover = computed(() =>
  (props.pet.photos.find(p => p.status === 'approved') ?? props.pet.photos.find(p => p.image))?.image ?? '')

// Visore a tutto schermo: si sfogliano le foto che hanno un'immagine (al proprietario anche quelle in attesa)
const { t } = useI18n()
const viewerPhotos = computed(() => props.pet.photos.filter(p => p.image).map(p => ({
  image: p.image!, alt: t('pet.photoOf', { name: props.pet.name }), credit: p.credit,
})))
const viewing = ref<number | null>(null)
const openPhoto = (image: string) => (viewing.value = Math.max(0, viewerPhotos.value.findIndex(p => p.image === image)))

// Nelle liste una riga di riquadri (due su mobile): le prime foto, poi "Mostra tutte" e "Aggiungi foto"
const tiles = computed(() => 8 - (props.editable ? 1 : 0))
const expanded = ref(false)
const shownPhotos = computed(() => {
  const all = props.pet.photos
  return props.hero || expanded.value || all.length <= tiles.value ? all : all.slice(0, tiles.value - 1)
})
const hiddenCount = computed(() => props.pet.photos.length - shownPhotos.value.length)
// Nelle liste i comandi del proprietario (modifica, elimina) compaiono solo dopo "Gestisci"
const managing = ref(!!props.hero)
const adoption = computed(() => props.pet.adoptionInfo?.status ?? null)

const error = ref('')
const confirming = ref<number | null>(null)

async function remove(photoId: number) {
  if (confirming.value !== photoId) {
    confirming.value = photoId
    return
  }
  try {
    await $fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    emit('changed')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  confirming.value = null
}

// Correzione dei dati e cancellazione del pet (solo il proprietario)
const editing = ref(false)
const form = reactive({ name: '', species: props.pet.species, breed: '', city: '' })
const saving = ref(false)
function startEdit() {
  Object.assign(form, { name: props.pet.name, species: props.pet.species, breed: props.pet.breed, city: props.pet.city })
  error.value = ''
  editing.value = true
}
async function save() {
  error.value = ''
  const check = petFieldsSchema.safeParse(form)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/pets/${props.pet.id}`, { method: 'PATCH', body: check.data })
    editing.value = false
    emit('changed')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    saving.value = false
  }
}

const confirmingPet = ref(false)
async function removePet() {
  if (!confirmingPet.value) {
    confirmingPet.value = true
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/pets/${props.pet.id}`, { method: 'DELETE' })
    emit('deleted')
  }
  catch (e) {
    error.value = errorMessage(e)
    confirmingPet.value = false
  }
  finally {
    saving.value = false
  }
}

// Prossima fascia di cuori da raggiungere (la vede solo il proprietario)
// Traguardo aperto: un tocco ne mostra la spiegazione (il title non basta sui telefoni)
const openBadge = ref<string | null>(null)
const nextTier = computed(() => HEART_TIERS.find(t => (props.pet.wins ?? 0) < t.min))
</script>

<template>
  <article class="pet-gallery" :class="{ 'pet-gallery--hero': hero }">
    <div class="pet-gallery__head">
      <figure v-if="cover" class="pet-gallery__cover"><PetEars :species="pet.species" /><component :is="hero ? 'button' : 'span'" :type="hero ? 'button' : undefined" class="pet-gallery__zoom" :class="{ 'pet-gallery__zoom--static': !hero }" :aria-label="hero ? $t('pet.openGallery') : undefined" @click="hero && openPhoto(cover)"><picture><source v-for="s in photoSources(cover, 's', hero ? '(min-width: 760px) 340px, 92vw' : '68px', hero ? 'v' : undefined)" :key="`${s.media}${s.type}`" v-bind="s"><img :src="cover" :alt="hero ? $t('pet.photoOf', { name: pet.name }) : ''" class="pet-gallery__cover-img"></picture></component></figure>
      <div class="pet-gallery__info">
        <div class="pet-gallery__title">
          <component :is="hero ? 'h1' : 'h2'" class="pet-gallery__name">
            <NuxtLink v-if="linkTitle" :to="`/pet/${pet.id}`" class="pet-gallery__name-link">{{ pet.name }}</NuxtLink>
            <template v-else>{{ pet.name }}</template>
          </component>
          <NuxtLink v-if="adoption && !hero" :to="`/pet/${pet.id}`" class="pet-gallery__adopt" :class="`pet-gallery__adopt--${adoption}`">{{ $t(`adoption.status.${adoption}`) }}</NuxtLink>
          <button
            v-if="editable && !hero" type="button" class="pet-gallery__manage" :class="{ 'is-active': managing }" :aria-pressed="managing"
            @click="managing = !managing; confirmingPet = false; confirming = null"
          >
            {{ managing ? $t('gallery.done') : $t('gallery.manage') }}
          </button>
        </div>
        <p class="pet-gallery__sub">{{ [pet.breed || speciesText(pet.species, 'one'), pet.city, hero ? `@${pet.owner}` : ''].filter(Boolean).join(' · ') }}</p>
        <slot name="actions" />
        <!-- I cuori li vede solo il proprietario: agli altri non si mostra un numero basso -->
        <div v-if="editable" class="pet-gallery__stats">
          <div class="pet-gallery__stat"><b class="pet-gallery__stat-value">♥ {{ pet.wins ?? 0 }}</b><span class="pet-gallery__stat-label">{{ $t('pet.hearts') }}</span></div>
        </div>
        <ul v-if="pet.badges.length" class="pet-gallery__badges" :aria-label="$t('badges.title')">
          <li v-for="b in pet.badges" :key="b.key">
            <button type="button" class="pet-gallery__badge" :class="{ 'is-active': openBadge === b.key }" :aria-expanded="openBadge === b.key" @click="openBadge = openBadge === b.key ? null : b.key">
              <span aria-hidden="true">{{ b.emoji }}</span> {{ $t(`badges.${b.key}.name`) }}<template v-if="b.times && b.times > 1"> ×{{ b.times }}</template>
            </button>
          </li>
        </ul>
        <p v-if="openBadge" class="pet-gallery__badge-desc" role="status">{{ $t(`badges.${openBadge}.desc`) }}</p>
        <!-- Prossimo traguardo di cuori: un obiettivo, solo per il proprietario -->
        <p v-if="editable && nextTier" class="pet-gallery__next">
          {{ $t('badges.next', { emoji: nextTier.emoji, name: $t(`badges.${nextTier.key}.name`), n: nextTier.min - (pet.wins ?? 0) }, nextTier.min - (pet.wins ?? 0)) }}
        </p>
        <ul v-if="pet.trophies.length" class="pet-gallery__trophies" :aria-label="$t('pet.trophies')">
          <li v-for="trophy in pet.trophies" :key="trophy.slug">
            <NuxtLink :to="`/sfide/${trophy.slug}`" class="pet-gallery__trophy"><PetRosette :place="1" class="pet-gallery__rosette" />{{ trophy.emoji }} {{ challengeText(trophy).title }}</NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="pet-gallery__grid">
      <figure v-for="photo in shownPhotos" :key="photo.id" class="pet-gallery__photo" :class="`pet-gallery__photo--${photo.status}`">
        <button v-if="photo.image" type="button" class="pet-gallery__zoom" :aria-label="$t('pet.zoomPhoto')" @click="openPhoto(photo.image)">
          <picture><source v-for="s in photoSources(photo.image, 'v', '(min-width: 760px) 170px, 31vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="photo.image" :alt="$t('pet.photoOf', { name: pet.name })" loading="lazy" class="pet-gallery__photo-img"></picture>
        </button>
        <div v-else class="pet-gallery__gone">{{ photo.rejectReason ? rejectReason(photo.rejectReason) : '' }}</div>
        <a
          v-if="photo.credit && !editable" class="pet-gallery__credit" :href="photo.credit.url ?? undefined"
          target="_blank" rel="noopener noreferrer nofollow ugc"
        >{{ $t('photo.credit', { text: photo.credit.text }) }}</a>
        <figcaption v-if="editable && (managing || photo.status !== 'approved')" class="pet-gallery__caption">
          <span class="pet-gallery__status">{{ photo.status !== 'approved' ? $t(`pet.photoStatus.${photo.status}`) : '' }}</span>
          <button v-if="managing" type="button" class="pet-gallery__remove" @click="remove(photo.id)">{{ confirming === photo.id ? $t('common.confirm') : $t('common.delete') }}</button>
        </figcaption>
      </figure>
      <button v-if="hiddenCount > 0" type="button" class="pet-gallery__tile pet-gallery__tile--more" @click="expanded = true">
        <b>+{{ hiddenCount }}</b>{{ $t('gallery.showAll', { n: pet.photos.length }) }}
      </button>
      <NuxtLink v-if="editable" :to="`/carica?pet=${pet.id}`" class="pet-gallery__tile pet-gallery__tile--add">+ {{ $t('pet.addPhoto') }}</NuxtLink>
    </div>
    <button v-if="expanded && !hero && pet.photos.length > tiles" type="button" class="pet-gallery__less" @click="expanded = false">{{ $t('gallery.showLess') }}</button>

    <form v-if="editable && managing && editing" class="pet-gallery__edit" novalidate @submit.prevent="save">
      <div class="pet-gallery__fields">
        <label class="pet-gallery__field">{{ $t('pet.name') }}<input v-model="form.name" required maxlength="40" class="input"></label>
        <label v-if="SPECIES.length" class="pet-gallery__field">{{ $t('pet.species') }}
          <select v-model="form.species" class="input">
            <option v-for="s in SPECIES" :key="s" :value="s">{{ speciesText(s, 'one') }}</option>
          </select>
        </label>
        <template v-if="HAS_BREED_CITY">
          <label class="pet-gallery__field">{{ $t('pet.breed') }}<input v-model="form.breed" maxlength="40" class="input"></label>
          <label class="pet-gallery__field">{{ $t('pet.city') }}<input v-model="form.city" maxlength="40" class="input"></label>
        </template>
      </div>
      <div class="pet-gallery__tools">
        <button type="button" class="btn btn--ghost btn--sm" @click="editing = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary btn--sm" :disabled="saving">{{ $t('common.save') }}</button>
      </div>
    </form>
    <div v-else-if="editable && managing" class="pet-gallery__tools">
      <button type="button" class="btn btn--ghost btn--sm" @click="startEdit">{{ $t('pet.editData') }}</button>
      <button type="button" class="btn btn--danger btn--sm" :disabled="saving" @click="removePet">
        {{ confirmingPet ? $t('pet.confirmDelete', { name: pet.name }) : $t('pet.delete') }}
      </button>
      <button v-if="confirmingPet" type="button" class="btn btn--ghost btn--sm" @click="confirmingPet = false">{{ $t('common.cancel') }}</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <PhotoViewer v-model="viewing" :photos="viewerPhotos" />
  </article>
</template>

<style lang="scss" scoped>
$scrim: rgba(30, 15, 5, .7);

// Organismo: scheda del pet con copertina, distintivi, trofei e galleria di foto
.pet-gallery {
  @include card($space-6, $radius-xl);
  @include stack($space-6);

  &__head { display: flex; gap: $space-6; align-items: center; }

  &__title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; width: 100%; }

  &__adopt {
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    @include pill(4px, 10px);
    background: var(--mint);
    color: #fff;
    letter-spacing: .02em;

    &--fostered { background: var(--sun); color: var(--sun-ink); }

    &--adopted { background: var(--heart-soft); color: var(--ink); }
  }

  &__manage {
    margin-left: auto;
    border: 2px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    @include pill(5px, 12px);
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;

    &.is-active { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  }

  &__info { min-width: 0; flex: 1; @include stack($space-3); align-items: flex-start; }

  &__cover { margin: 0; flex-shrink: 0; position: relative; --ear: 22px; }

  &__cover-img { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 4px solid var(--bg); }

  &__name { font-size: 24px; line-height: 1.05; }

  &__name-link { @include plain-link; }

  &__sub { margin: -4px 0 0; color: var(--muted); font-size: 14px; font-weight: 700; }

  &__stats { @include cluster($space-2); }

  &__stat { background: var(--bg); border-radius: 16px; padding: 6px 12px; text-align: center; min-width: 64px; }

  &__stat-value { display: block; font-family: var(--display); font-weight: 700; font-size: 18px; color: var(--coral); font-variant-numeric: tabular-nums; }

  &__stat-label { @include eyebrow; font-size: 10px; }

  &__badges, &__trophies { list-style: none; margin: 0; padding: 0; @include cluster($space-2); }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    padding: 4px 11px 4px 8px;
    border-radius: $radius-pill;
    border: 2px solid transparent;
    background: var(--coral-soft);
    color: var(--coral-deep);

    &.is-active { border-color: var(--coral-deep); }
  }

  &__badge-desc { margin: 0; font-size: 13px; font-weight: 700; color: var(--ink); }

  &__next { margin: 0; font-size: 12px; font-weight: 800; color: var(--muted); }

  &__trophy {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    padding: 3px 12px 3px 4px;
    border-radius: $radius-pill;
    background: var(--sun);
    color: var(--sun-ink);
  }

  &__rosette { width: 18px; height: 24px; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-2;

    @include mq(md) { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: $space-3; }
  }

  &__photo { margin: 0; position: relative; aspect-ratio: 3 / 4; border-radius: $radius-sm; overflow: hidden; background: var(--line); }

  &__photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;

    .pet-gallery__photo--pending & { opacity: .6; }
  }

  &__zoom {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
    border-radius: inherit;

    &--static { cursor: auto; }

    .pet-gallery__cover & { height: auto; }
  }

  &__tile {
    aspect-ratio: 3 / 4;
    border-radius: $radius-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-weight: 800;
    text-decoration: none;
    padding: 6px;
    font-size: 12px;
    cursor: pointer;
    line-height: 1.2;

    &--more {
      border: 0;
      background: var(--bg);
      color: var(--ink);

      b { font-family: var(--display); font-size: 24px; color: var(--coral); }
    }

    &--add { border: 2px dashed var(--line); color: var(--coral); }
  }

  &__less { align-self: center; border: 0; background: none; color: var(--coral-deep); font-weight: 800; cursor: pointer; margin-top: -6px; }

  &__credit {
    position: absolute;
    inset: auto 0 0 0;
    padding: 14px 8px 5px;
    font-size: 9px;
    color: #fff;
    text-decoration: none;
    background: linear-gradient(transparent, rgba(30, 15, 5, .65));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__gone { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px; font-size: 12px; color: var(--muted); }

  &__caption { position: absolute; inset: auto 0 0 0; display: flex; justify-content: space-between; align-items: center; gap: $space-1; padding: 6px; background: linear-gradient(transparent, $scrim); }

  &__status {
    font-size: 11px;
    font-weight: 800;
    color: #fff;

    .pet-gallery__photo--pending & { color: #ffd166; }

    .pet-gallery__photo--rejected & { color: #ff9a8a; }
  }

  &__remove { border: 0; @include pill(3px, 8px); font-size: 11px; font-weight: 800; background: rgba(255, 255, 255, .92); color: #3d2416; cursor: pointer; }

  &__tools { @include cluster($space-3); justify-content: flex-end; }

  &__edit { @include stack($space-4); border-top: 2px dashed var(--line); padding-top: 12px; }

  &__fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: $space-3; }

  &__field { @include stack($space-1); font-weight: 700; font-size: 13px; }

  // Pagina del pet: grande foto in cornice e dati accanto (sotto, su mobile)
  &--hero {
    background: none;
    box-shadow: none;
    padding: 0;

    .pet-gallery__head {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;

      @include mq(md) { flex-direction: row; align-items: center; gap: 28px; }
    }

    .pet-gallery__cover {
      --ear: 48px;
      margin-top: 30px;
      background: var(--surface);
      padding: 7px;
      border-radius: 30px;
      box-shadow: 0 18px 30px -18px var(--glow);

      @include mq(md) { width: 340px; --ear: 64px; }
    }

    .pet-gallery__cover-img {
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      border-radius: 22px;
      border: 0;

      @include mq(md) { aspect-ratio: 3 / 4; }
    }

    .pet-gallery__name { font-size: 34px; }

    .pet-gallery__stat { background: var(--surface); box-shadow: 0 2px 0 var(--line); min-width: 78px; }

    .pet-gallery__grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  }
}
</style>
