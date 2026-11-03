<script setup lang="ts">
import type { FollowedWork } from '#shared/models'

// Pagina: i lavori nuovi di chi segui (caricati da lui o che lo indicano come artista), e l'elenco di chi segui
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => t('follow.title') })
const { data, pending } = useLazyFetch<{ users: string[], works: FollowedWork[] }>('/api/me/following', { server: false })
</script>

<template>
  <section class="following">
    <header>
      <h1 class="following__title">✨ {{ $t('follow.title') }}</h1>
      <p class="following__lead">{{ $t('follow.lead') }}</p>
    </header>

    <ul v-if="data?.users.length" class="following__users" :aria-label="$t('follow.whoTitle')">
      <li v-for="u in data.users" :key="u"><NuxtLink :to="`/u/${u}`" class="following__user">@{{ u }}</NuxtLink></li>
    </ul>

    <p v-if="!pending && !data?.works.length" class="following__empty">{{ data?.users.length ? $t('follow.noWorks') : $t('follow.empty') }}</p>

    <ul v-else class="following__grid">
      <PetTile v-for="w in data?.works" :id="w.petId" :key="w.photoId" :name="w.name" :image="w.image" :owner="w.owner" :credit="w.credit">
        <small class="pet-tile__when">{{ timeAgo(w.createdAt) }}</small>
      </PetTile>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.following {
  @include pet-list-page;

  &__users { display: flex; flex-wrap: wrap; gap: $space-2; margin: 0; padding: 0; list-style: none; }

  &__user {
    @include plain-link(var(--ink));
    display: inline-block;
    background: var(--surface);
    border: 2px solid var(--line);
    @include pill(6px, 12px);
    font-weight: 800;
    font-size: 14px;

    &:hover { border-color: var(--action); }
  }
}
</style>
