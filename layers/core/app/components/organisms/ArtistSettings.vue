<script setup lang="ts">
import { MAX_ARTIST_LINKS, artistSettingsSchema, type ArtistSettings } from '#shared/models'

// Organismo: segnarsi come artista e scegliere le pagine social da mostrare sul profilo (siti con askCredit)
const { t } = useI18n()
const { data } = await useFetch<ArtistSettings>('/api/me/artist')

const isArtist = ref(false)
const links = ref<string[]>([])
watch(data, (d) => {
  if (!d) return
  isArtist.value = d.isArtist
  links.value = d.links.length ? [...d.links] : ['']
}, { immediate: true })

const saving = ref(false)
const saved = ref(false)
const error = ref('')

function addLink() {
  if (links.value.length < MAX_ARTIST_LINKS) links.value.push('')
}

function removeLink(i: number) {
  links.value.splice(i, 1)
  if (!links.value.length) links.value.push('')
}

async function save() {
  error.value = ''
  saved.value = false
  const check = artistSettingsSchema.safeParse({ isArtist: isArtist.value, links: links.value.map(l => l.trim()).filter(Boolean) })
  if (!check.success) {
    error.value = t(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  saving.value = true
  try {
    const result = await $fetch<ArtistSettings>('/api/me/artist', { method: 'PUT', body: check.data })
    links.value = result.links.length ? [...result.links] : ['']
    saved.value = true
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="artist-settings" @submit.prevent="save">
    <label class="artist-settings__toggle">
      <input v-model="isArtist" type="checkbox" class="artist-settings__checkbox" @change="saved = false">
      <span>{{ $t('artist.toggle') }}</span>
    </label>
    <p class="artist-settings__help">{{ $t('artist.toggleHelp') }}</p>

    <fieldset v-if="isArtist" class="artist-settings__links">
      <legend class="label">{{ $t('artist.links') }}</legend>
      <div v-for="(_, i) in links" :key="i" class="artist-settings__row">
        <input
          v-model="links[i]" type="url" inputmode="url" maxlength="200" placeholder="https://" autocomplete="off"
          class="input" :aria-label="$t('artist.linkN', { n: i + 1 })" @input="saved = false"
        >
        <button type="button" class="artist-settings__remove" :aria-label="$t('common.delete')" @click="removeLink(i); saved = false">✕</button>
      </div>
      <button v-if="links.length < MAX_ARTIST_LINKS" type="button" class="btn btn--ghost artist-settings__add" @click="addLink">+ {{ $t('artist.addLink') }}</button>
    </fieldset>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="artist-settings__foot">
      <button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? $t('auth.wait') : $t('artist.save') }}</button>
      <span v-if="saved" class="artist-settings__saved" role="status">✓ {{ $t('artist.saved') }}</span>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.artist-settings {
  @include stack($space-4);

  &__toggle { display: flex; gap: $space-3; align-items: center; font-weight: 800; }

  &__checkbox { width: 18px; height: 18px; accent-color: var(--action); }

  &__help { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }

  &__links {
    @include stack($space-3);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  &__row { display: flex; gap: $space-2; align-items: center; }

  &__remove {
    flex: none;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: color-mix(in srgb, var(--muted) 14%, transparent);
    color: var(--muted);
    font-weight: 900;
    cursor: pointer;
  }

  &__add { align-self: flex-start; }

  &__foot { @include cluster($space-3); align-items: center; }

  &__saved { color: var(--muted); font-weight: 800; font-size: 14px; }
}
</style>
