<script setup lang="ts">
import type { Artwork } from '#shared/models'

// Organismo: immagini caricate da altri che indicano questa persona come artista.
// Sul proprio profilo si può togliere il proprio nome ("non sono io") o segnalare un caricamento senza permesso
const props = defineProps<{ artworks: Artwork[], isMe: boolean }>()
const emit = defineEmits<{ changed: [] }>()

const confirming = ref<number | null>(null)
const error = ref('')

async function untag(a: Artwork) {
  if (confirming.value !== a.photoId) {
    confirming.value = a.photoId
    return
  }
  error.value = ''
  try {
    await $fetch(`/api/me/credits/${a.photoId}`, { method: 'DELETE' })
    emit('changed')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    confirming.value = null
  }
}
</script>

<template>
  <section class="artist-works" aria-labelledby="artist-works-title">
    <h2 id="artist-works-title" class="artist-works__title">🎨 {{ $t('artist.works', props.artworks.length) }}</h2>
    <p v-if="isMe" class="artist-works__help">{{ $t('artist.worksHelp') }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <ul class="artist-works__grid">
      <li v-for="a in artworks" :key="a.photoId" class="artist-works__item">
        <NuxtLink :to="entryUrl(a.petId)" class="artist-works__link">
          <picture><source v-for="s in photoSources(a.image, 'v', '(min-width: 760px) 150px, 31vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="a.image" :alt="a.name" loading="lazy" class="artist-works__img"></picture>
          <span class="artist-works__name">{{ a.name }}</span>
        </NuxtLink>
        <div v-if="isMe" class="artist-works__actions">
          <button type="button" class="artist-works__untag" @click="untag(a)">
            {{ confirming === a.photoId ? $t('common.confirm') : $t('artist.notMe') }}
          </button>
          <ReportButton :photo-id="a.photoId" preset="stolen" :label="$t('artist.notAllowed')" />
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.artist-works {
  @include stack($space-4);

  &__title { font-size: 20px; }

  &__help { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(31%, 150px), 1fr));
    gap: $space-3;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item { @include stack($space-2); min-width: 0; }

  &__link { @include stack($space-1); @include plain-link(var(--ink)); min-width: 0; }

  &__img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 16px; background: var(--line); }

  &__name { font-weight: 800; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__actions { display: flex; flex-wrap: wrap; gap: 0 $space-2; color: var(--muted); }

  &__untag {
    border: 0;
    padding: 4px 6px;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;

    &:hover, &:focus-visible { text-decoration: underline; }
  }
}
</style>
