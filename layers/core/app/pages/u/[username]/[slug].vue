<script setup lang="ts">
import site from '#site'
import { HAS_SONA, entrySlug, entryUrl, rankingPath, type MyShelter, type PetGallery } from '#shared/models'

// Pagina di un partecipante: /u/<proprietario>/<nome> (entryUrl). Prima si trova quale partecipante è,
// poi si caricano i suoi dati; un vecchio nome o le maiuscole portano all'indirizzo giusto
const route = useRoute()
const username = computed(() => String(route.params.username))
const { data: found, error } = await useFetch<{ id: number, slug: string }>(
  () => `/api/users/${encodeURIComponent(username.value)}/pets/${encodeURIComponent(String(route.params.slug))}`,
)
const { data: pet, refresh } = await useFetch<PetGallery & { isMine: boolean, speciesRank: number | null }>(
  () => `/api/pets/${found.value?.id}`,
  { immediate: !!found.value, watch: [found] },
)
if (found.value && found.value.slug !== route.params.slug) {
  await navigateTo({ path: `/u/${username.value}/${encodeURIComponent(found.value.slug)}`, query: route.query }, { replace: true, redirectCode: 301 })
}

// Dopo una rinomina dalla pagina stessa, l'indirizzo segue il nome nuovo
async function onChanged() {
  await refresh()
  if (pet.value && entrySlug(pet.value.name) !== route.params.slug) {
    await navigateTo({ path: entryUrl(pet.value), query: route.query }, { replace: true })
  }
}

// Il rifugio verificato che possiede il pet può compilarne la scheda di adozione (solo sui siti con i rifugi)
const { features } = useAppConfig()
const { data: mine, execute: loadMine } = useLazyFetch<MyShelter>('/api/shelters/me', { server: false, immediate: false })
onMounted(() => watch(() => pet.value?.isMine, isMine => isMine && features.shelters && loadMine(), { immediate: true }))
const manage = computed(() => !!pet.value?.isMine && mine.value?.shelter?.status === 'approved')

async function onDeleted() {
  await navigateTo(`/u/${pet.value!.owner}`)
}

// Link condivisi da una sfida: ?challenge=<slug>
const challengeSlug = computed(() => {
  const q = route.query.challenge
  return typeof q === 'string' && /^[a-z0-9-]{1,80}$/.test(q) ? q : undefined
})

// Da un avviso di festa (?share=1) la card da condividere è già aperta, solo per il proprietario
const shareNow = computed(() => route.query.share === '1' && !!pet.value?.isMine)

// Anteprima del link su WhatsApp, Telegram, Facebook, X…
const origin = useRequestURL().origin
const isPublic = computed(() => !!pet.value?.photos.some(p => p.status === 'approved'))
// La copertina è la prima foto approvata: è quella che si segnala da qui (le altre dal visore)
const coverId = computed(() => pet.value?.photos.find(p => p.status === 'approved')?.id)
const { t } = useI18n()
const title = () => pet.value?.name ?? ''
useSeoMeta({
  title,
  // Nelle anteprime dei link il titolo non passa dal titleTemplate: il nome del sito si aggiunge qui
  ogTitle: () => [title(), site.name].filter(Boolean).join(' · '),
  ogDescription: () => (pet.value ? t('pet.ogDescription', { name: pet.value.name }) : ''),
  ogImage: () => (isPublic.value && pet.value ? `${origin}/card/${pet.value.id}.png?format=og${challengeSlug.value ? `&challenge=${challengeSlug.value}` : ''}` : undefined),
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})

</script>

<template>
  <section class="pet-page">
    <p v-if="error" class="pet-page__empty">{{ $t('pet.notFound') }}</p>
    <template v-else-if="pet">
      <NuxtLink :to="`/u/${pet.owner}`" class="pet-page__owner">← @{{ pet.owner }}</NuxtLink>
      <NuxtLink v-if="challengeSlug" :to="`/challenges/${challengeSlug}`" class="pet-page__challenge">
        🏆 {{ $t('pet.inChallenge', { name: pet.name }) }} →
      </NuxtLink>
      <PetGallery :pet="pet" :editable="pet.isMine" hero @changed="onChanged" @deleted="onDeleted">
        <template #actions>
          <div class="pet-page__actions">
            <NuxtLink
              v-if="pet.speciesRank"
              :to="{ path: rankingPath(pet.species), query: { period: 'all' } }"
              class="pet-page__rank"
            >
              <PetRosette v-if="pet.speciesRank <= 3" :place="pet.speciesRank" class="pet-page__rosette" />
              {{ $t('pet.rank', { rank: pet.speciesRank, among: speciesText(pet.species, 'among') }) }}
            </NuxtLink>
            <ShareCard v-if="isPublic" :pet-id="pet.id" :pet-name="pet.name" :owner="pet.owner" :challenge="challengeSlug" :auto-open="shareNow" />
            <FavoriteButton v-if="isPublic && !pet.isMine" :pet-id="pet.id" />
            <ReportButton v-if="coverId && !pet.isMine" :photo-id="coverId" class="pet-page__report" />
          </div>
        </template>
      </PetGallery>
      <!-- Siti con le sona: la scheda del personaggio (reference, colori, regole) sta qui, non più nel profilo -->
      <SonaSheet v-if="HAS_SONA" :pet="pet" :editable="pet.isMine" embedded @changed="refresh()" />
      <PetCompliments v-if="isPublic" :pet-id="pet.id" />
      <AdoptionCard :pet="pet" :manage="manage" @changed="refresh()" />
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: un pet, con galleria e scheda di adozione
.pet-page {
  @include stack($space-4);
  padding-bottom: 12px;

  &__owner { @include plain-link(var(--muted)); font-weight: 700; }

  &__actions { @include cluster($space-3); align-items: center; }

  &__challenge { background: var(--sun); color: var(--sun-ink); font-weight: 800; padding: 12px 16px; border-radius: $radius-md; text-decoration: none; }

  &__rank {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    background: var(--coral-soft);
    color: var(--coral);
    font-weight: 900;
    @include pill(7px, 14px);
    text-decoration: none;
  }

  &__rosette { width: 18px; height: 24px; margin: -4px 0; }

  &__empty { text-align: center; color: var(--muted); padding: 30px 0; }
}
</style>
