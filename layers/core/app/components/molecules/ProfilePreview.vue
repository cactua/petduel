<script setup lang="ts">
import { linkLabel, linkPlatform } from '../../utils/links'
import type { Profile } from '#shared/models'

/**
 * Anteprima della testata del profilo (/u/<utente>) mentre lo si modifica: stessi pezzi e stesso ordine
 * della pagina vera (nome, riga "Artista · pronomi", bio di tre righe, commissioni, link). Avatar e
 * banner si cambiano da qui, come sul profilo
 */
const props = defineProps<{ profile: Profile }>()
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()

const subLine = computed(() => [
  props.profile.artist ? t('artist.badge') : '',
  props.profile.pronouns,
  props.profile.pets.length ? t('profile.petCount', { n: props.profile.pets.length }, props.profile.pets.length) : '',
].filter(Boolean).join(' · '))
const bioLong = computed(() => props.profile.bio.length > 160 || props.profile.bio.split('\n').length > 3)
const links = computed(() => (props.profile.artist?.links ?? []).filter(l => linkPlatform(l)))
const askUrl = computed(() => props.profile.artist?.commissionsUrl && linkPlatform(props.profile.artist.commissionsUrl) ? props.profile.artist.commissionsUrl : '')
</script>

<template>
  <div class="profile-preview">
    <ProfileMedia :profile="profile" @saved="emit('saved')">
      <div class="profile-preview__names">
        <p class="profile-preview__title">@{{ profile.username }}</p>
        <p v-if="subLine" class="profile-preview__sub">
          <span v-if="profile.artist" aria-hidden="true">🎨 </span>{{ subLine }}
        </p>
      </div>
    </ProfileMedia>

    <p v-if="profile.bio" class="profile-preview__bio" :class="{ 'is-clamped': bioLong }">{{ profile.bio }}</p>
    <p v-else class="profile-preview__placeholder">{{ $t('account.previewNoBio') }}</p>

    <div v-if="profile.artist?.commissions === 'open'" class="profile-preview__commissions">
      <b class="profile-preview__commissions-state">● {{ $t('artist.commissions.open') }}</b>
      <!-- Solo un'immagine della pagina vera: il bottone non porta da nessuna parte -->
      <span v-if="askUrl" class="profile-preview__commissions-ask">{{ $t('artist.ask') }} ↗</span>
    </div>
    <p v-else-if="profile.artist?.commissions === 'closed'" class="profile-preview__sub">● {{ $t('artist.commissions.closed') }}</p>

    <ul v-if="links.length" class="profile-preview__links" :aria-label="$t('artist.links')">
      <li v-for="link in links" :key="link" class="profile-preview__link">{{ linkLabel(link) }} ↗</li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: la testata del profilo in piccolo, con le stesse regole di pages/u/[username]/index.vue
.profile-preview {
  @include card(18px, $radius-xl);
  @include stack(16px);
  overflow: hidden;
  min-width: 0;

  &__names { min-width: 0; @include stack(2px); align-items: flex-start; padding-top: $space-2; }

  &__title { margin: 0; font-family: var(--display); font-weight: 700; font-size: 24px; line-height: 1.1; overflow-wrap: anywhere; }

  &__sub { margin: 0; color: var(--muted); font-weight: 700; }

  &__bio {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    white-space: pre-line;
    overflow-wrap: anywhere;

    &.is-clamped { @include line-clamp(3); }
  }

  &__placeholder { margin: 0; color: var(--muted); font-style: italic; font-size: 14px; }

  &__commissions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: 10px 10px 10px 14px;
    border-radius: $radius-md;
    background: color-mix(in srgb, var(--mint) 16%, var(--surface));
  }

  &__commissions-state { font-size: 15px; color: color-mix(in srgb, var(--mint) 45%, var(--ink)); }

  &__commissions-ask {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 16px;
    border-radius: $radius-pill;
    background: color-mix(in srgb, var(--mint) 55%, #000);
    color: #fff;
    font-weight: 900;
    font-size: 14px;
  }

  &__links { @include cluster($space-2); margin: 0; padding: 0; list-style: none; }

  &__link {
    @include pill(6px, 12px);
    border: 2px solid var(--line);
    font-size: 13px;
    font-weight: 800;
  }
}
</style>
