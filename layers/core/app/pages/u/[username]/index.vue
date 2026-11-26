<script setup lang="ts">
import site from '#site'
import { shelterImageSources } from '#shared/images'
import { HAS_ARTISTS, HAS_SONA, entryUrl, type AdoptionStatus, type PetGallery as Gallery, type Profile } from '#shared/models'

const { features } = useAppConfig()

const route = useRoute()
const { user } = useUserSession()
const { data: profile, error, refresh } = await useFetch<Profile>(() => `/api/users/${route.params.username}`)

const { t } = useI18n()
// Limite di voci per utente (Impostazioni admin): raggiunto, il bottone "Nuovo" lascia il posto all'avviso
const limits = useSiteLimits()
const petsFull = computed(() => !!profile.value?.isMe && limits.petsFull(profile.value.pets.length))
useHead({ title: () => (profile.value?.shelter?.name ?? (profile.value ? `@${profile.value.username}` : t('nav.profile'))) })
// Anteprima del link del profilo: la card del suo primo personaggio pubblico (altrimenti resta quella del sito)
const origin = useRequestURL().origin
const ogPet = computed(() => profile.value?.shelter ? undefined : profile.value?.pets.find(p => p.photos.some(ph => ph.status === 'approved')))
useSeoMeta({
  ogTitle: () => (profile.value ? `@${profile.value.username} · ${site.name}` : undefined),
  ogImage: () => (ogPet.value ? `${origin}/card/${ogPet.value.id}.png?format=og` : undefined),
})

const since = computed(() => profile.value
  ? new Date(profile.value.memberSince).toLocaleDateString(intlLocale(), { month: 'long', year: 'numeric' })
  : '')
const pending = computed(() => profile.value?.pets.reduce((n, p) => n + p.photos.filter(ph => ph.status === 'pending').length, 0) ?? 0)

const shelter = computed(() => profile.value?.shelter ?? null)
const manage = computed(() => profile.value?.manage ?? null)
const banner = computed(() => (shelter.value?.banner ? shelterImageSources(shelter.value.banner, 'banner') : null))
const logo = computed(() => (shelter.value?.logo ? shelterImageSources(shelter.value.logo, 'logo').src : null))

const pets = computed(() => profile.value?.pets ?? [])
const stats = computed(() => [
  { value: pets.value.length, label: shelter.value ? t('profile.statGuests') : t('profile.statPets') },
  { value: profile.value?.votes ?? 0, label: t('profile.statVotes') },
  // I cuori dei propri pet li vede solo il proprietario
  ...(profile.value?.isMe ? [{ value: pets.value.reduce((n, p) => n + (p.wins ?? 0), 0), label: t('profile.statWins') }] : []),
  { value: pets.value.reduce((n, p) => n + p.trophies.length, 0), label: t('profile.statTrophies') },
  // Chi ti segue lo vedi solo tu
  ...(profile.value?.isMe ? [{ value: profile.value.followers ?? 0, label: t('follow.followers') }] : []),
].filter((s, i) => i < 2 || s.value))

// Pet di un rifugio divisi per stato dell'adozione; gli altri profili restano una lista unica
type Group = AdoptionStatus | 'other'
const GROUPS: Group[] = ['available', 'fostered', 'adopted', 'other']
const groupOf = (p: Gallery): Group => p.adoptionInfo?.status ?? 'other'
const grouped = computed(() => pets.value.some(p => p.adoptionInfo))
const groups = computed(() => GROUPS
  .map(g => ({ id: g, pets: pets.value.filter(p => groupOf(p) === g) }))
  .filter(g => g.pets.length))
const filter = ref<Group | 'all'>('all')
const visibleGroups = computed(() => groups.value.filter(g => filter.value === 'all' || g.id === filter.value))

// Blocca: due tocchi, il secondo conferma. Sbloccare è immediato
const confirmBlock = ref(false)
async function toggleBlock() {
  if (!profile.value) return
  const blocked = !profile.value.blocked
  if (blocked && !confirmBlock.value) {
    confirmBlock.value = true
    return
  }
  confirmBlock.value = false
  await $fetch(`/api/users/${profile.value.username}/block`, { method: 'POST', body: { blocked } })
  await refresh()
}

// Segui: i suoi lavori nuovi finiscono in /following. Chi non è collegato va ad accedere
const following = ref(false)
watchEffect(() => (following.value = !!profile.value?.following))
const followBusy = ref(false)
async function toggleFollow() {
  if (!profile.value) return
  if (!user.value) return navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  followBusy.value = true
  try {
    const res = await $fetch<{ following: boolean }>(`/api/users/${profile.value.username}/follow`, { method: 'POST', body: { following: !following.value } })
    following.value = res.following
  }
  finally {
    followBusy.value = false
  }
}

const thumb = (p: Gallery) => (p.photos.find(ph => ph.status === 'approved') ?? p.photos.find(ph => ph.image))?.image ?? ''

// Condividi il profilo: menu del telefono se c'è, altrimenti il link copiato
const shareStatus = ref('')
async function shareProfile() {
  const url = location.href.split('#')[0]!
  try {
    if (navigator.share) await navigator.share({ title: profile.value ? `@${profile.value.username}` : '', url })
    else {
      await navigator.clipboard.writeText(url)
      shareStatus.value = t('profile.linkCopied')
    }
  }
  catch { /* condivisione annullata */ }
}

// --- Testata: chi è, in una riga; i numeri che contano per chi visita, gli altri solo al proprietario ---
const approvedCount = (p: Gallery) => p.photos.filter(ph => ph.status === 'approved').length
const trophies = computed(() => pets.value.reduce((n, p) => n + p.trophies.length, 0))
const subLine = computed(() => [
  profile.value?.artist ? t('artist.badge') : '',
  profile.value?.pronouns ?? '',
  pets.value.length ? t('profile.petCount', { n: pets.value.length }, pets.value.length) : '',
  trophies.value ? t('profile.trophyCount', { n: trophies.value }, trophies.value) : '',
].filter(Boolean).join(' · '))
// Al proprietario: cuori, chi lo segue, voti dati. Non stanno nella testata che vedono tutti
const myStats = computed(() => profile.value?.isMe
  ? [
      { value: pets.value.reduce((n, p) => n + (p.wins ?? 0), 0), label: t('profile.statWins') },
      { value: profile.value.followers ?? 0, label: t('follow.followers') },
      { value: profile.value.votes, label: t('profile.statVotes') },
    ]
  : [])
// Bio lunga: tre righe, poi "Altro"
const bioOpen = ref(false)
const bioLong = computed(() => (profile.value?.bio.length ?? 0) > 160 || (profile.value?.bio.split('\n').length ?? 0) > 3)
const menuOpen = ref(false)

// --- Siti con le sona (furry): un artista apre sui suoi disegni, gli altri sui personaggi ---
const sonaMode = computed(() => HAS_SONA && !shelter.value)
type Tab = 'art' | 'characters' | 'gallery'
const tabs = computed<Tab[]>(() => [
  ...(profile.value?.artist && (profile.value.artworks.length || profile.value.isMe) ? ['art' as const] : []),
  ...(pets.value.length || profile.value?.isMe ? ['characters' as const] : []),
  // Per un artista le immagini dei suoi personaggi stanno nelle loro pagine: la scheda Disegni basta
  ...(!profile.value?.artist && pets.value.some(p => approvedCount(p)) ? ['gallery' as const] : []),
])
const tab = ref<Tab>(tabs.value[0] ?? 'characters')
// Passando da un profilo a un altro (la pagina resta la stessa) si riparte dalla prima scheda
watch(() => profile.value?.username, () => {
  tab.value = tabs.value[0] ?? 'characters'
})
watchEffect(() => {
  if (tabs.value.length && !tabs.value.includes(tab.value)) tab.value = tabs.value[0]!
})
// Disegni: quelli per altri e quelli dei suoi personaggi
const ownIds = computed(() => new Set(pets.value.map(p => p.id)))
const artFilter = ref<'all' | 'others' | 'own'>('all')
const artOthers = computed(() => profile.value?.artworks.filter(a => !ownIds.value.has(a.petId)) ?? [])
const artOwn = computed(() => profile.value?.artworks.filter(a => ownIds.value.has(a.petId)) ?? [])
const artItems = computed(() => artFilter.value === 'others' ? artOthers.value : artFilter.value === 'own' ? artOwn.value : profile.value?.artworks ?? [])
const tabCount = (k: Tab) => k === 'art'
  ? profile.value?.artworks.length ?? 0
  : k === 'characters' ? pets.value.length : pets.value.reduce((n, p) => n + approvedCount(p), 0)

// I vecchi link a un personaggio aperto nel profilo (?c=<id>) portano alla sua pagina
if (HAS_SONA && route.query.c && pets.value.some(p => p.id === Number(route.query.c))) {
  await navigateTo(entryIdUrl(Number(route.query.c)), { replace: true })
}
// Frecce sinistra/destra tra le schede, come si aspetta chi usa la tastiera
const tabRefs = ref<HTMLButtonElement[]>([])
function onTabKey(e: KeyboardEvent, i: number) {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!step) return
  e.preventDefault()
  const next = (i + step + tabs.value.length) % tabs.value.length
  tab.value = tabs.value[next]!
  tabRefs.value[next]?.focus()
}

// Galleria: tutte le immagini pubblicate dei suoi personaggi, filtrabili per personaggio
const galleryFilter = ref<number | 'all'>('all')
const galleryItems = computed(() => pets.value
  .filter(p => galleryFilter.value === 'all' || p.id === galleryFilter.value)
  .flatMap(p => p.photos.filter(ph => ph.status === 'approved' && ph.image).map(ph => ({ ...ph, pet: p.name, petId: p.id })))
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
const viewing = ref<number | null>(null)
const viewerPhotos = computed(() => galleryItems.value.map(g => ({ image: g.image, alt: t('pet.photoOf', { name: g.pet }), credit: g.credit, id: g.id })))
</script>

<template>
  <section class="profile">
    <p v-if="error" class="profile__empty">{{ $t('profile.notFound') }}</p>
    <template v-else-if="profile">
      <!-- Testata: per un rifugio è la sua "vetrina", con nome, logo e colore scelti -->
      <header v-if="shelter" class="profile__card profile__hero profile__hero--shelter" :style="accentStyle(shelter.accent)">
        <div class="profile__banner">
          <picture v-if="banner">
            <source type="image/avif" :srcset="banner.avif" sizes="(min-width: 1000px) 1000px, 100vw">
            <source type="image/webp" :srcset="banner.webp" sizes="(min-width: 1000px) 1000px, 100vw">
            <img :src="banner.src" alt="" class="profile__cover">
          </picture>
        </div>
        <div class="profile__id">
          <span class="profile__avatar profile__avatar--logo">
            <img v-if="logo" :src="logo" alt="" class="profile__cover">
            <template v-else>{{ shelter.name.slice(0, 1) }}</template>
          </span>
          <div class="profile__names">
            <span class="badge badge--ok">✓ {{ $t('shelter.verified') }}</span>
            <h1 class="profile__title">{{ shelter.name }}</h1>
            <p class="profile__sub">@{{ profile.username }} · 📍 {{ shelter.city }}</p>
            <p v-if="shelter.tagline" class="profile__sub profile__sub--tagline">{{ shelter.tagline }}</p>
          </div>
        </div>
        <dl class="profile__stats">
          <div v-for="s in stats" :key="s.label" class="profile__stat"><dt class="profile__stat-label">{{ s.label }}</dt><dd class="profile__stat-value">{{ s.value }}</dd></div>
        </dl>
        <nav class="profile__actions">
          <NuxtLink :to="`/shelters/${shelter.slug}`" class="btn btn--ghost">🏠 {{ $t('profile.visitShelter') }}</NuxtLink>
          <a v-if="pets.length" href="#pets" class="btn btn--ghost">🐾 {{ $t('profile.seeGuests') }}</a>
        </nav>
        <div v-if="!profile.isMe" class="profile__report">
          <ReportButton :username="profile.username" />
          <button v-if="user" type="button" class="profile__block" @click="toggleBlock">
            {{ profile.blocked ? $t('block.unblock') : confirmBlock ? $t('block.confirm') : $t('block.block') }}
          </button>
        </div>
      </header>

      <header v-else class="profile__card profile__hero" :class="{ 'profile__hero--banner': profile.banner || profile.isMe }">
        <ProfileMedia :profile="profile" @saved="refresh()">
          <div class="profile__names">
            <h1 class="profile__title">@{{ profile.username }}</h1>
            <p v-if="subLine" class="profile__sub">
              <span v-if="profile.artist" aria-hidden="true">🎨 </span>{{ subLine }}
            </p>
          </div>
        </ProfileMedia>
        <div v-if="profile.bio" class="profile__about">
          <p :id="`bio-${profile.username}`" class="profile__bio" :class="{ 'is-clamped': bioLong && !bioOpen }">{{ profile.bio }}</p>
          <button
            v-if="bioLong" type="button" class="profile__more" :aria-expanded="bioOpen" :aria-controls="`bio-${profile.username}`"
            @click="bioOpen = !bioOpen"
          >
            {{ bioOpen ? $t('profile.bioLess') : $t('profile.bioMore') }}
          </button>
        </div>

        <!-- Commissioni: aperte in evidenza, con il bottone per chiederle; chiuse in una riga -->
        <div v-if="profile.artist?.commissions === 'open'" class="profile__commissions">
          <b class="profile__commissions-state">● {{ $t('artist.commissions.open') }}</b>
          <a
            v-if="profile.artist.commissionsUrl" :href="profile.artist.commissionsUrl" target="_blank" rel="noopener noreferrer nofollow ugc"
            class="profile__commissions-ask"
          >{{ $t('artist.ask') }} ↗</a>
        </div>
        <p v-else-if="profile.artist?.commissions === 'closed'" class="profile__sub">● {{ $t('artist.commissions.closed') }}</p>
        <!-- Pagine social dell'artista: link scritti da lui, quindi niente "follow" -->
        <ul v-if="profile.artist?.links.length" class="profile__links" :aria-label="$t('artist.links')">
          <li v-for="link in profile.artist.links" :key="link">
            <a :href="link" target="_blank" rel="noopener noreferrer nofollow ugc" class="btn btn--ghost profile__link">{{ linkLabel(link) }} ↗</a>
          </li>
        </ul>

        <!-- Azioni: una principale, condividi, e il resto (segnala, blocca) nel menu ⋯ -->
        <div class="profile__actions">
          <template v-if="profile.isMe">
            <NuxtLink v-if="!petsFull" to="/upload" class="btn btn--primary">+ {{ $t('profile.newPet') }}</NuxtLink>
            <NuxtLink to="/account#bio" class="btn btn--ghost">{{ $t('profile.edit') }}</NuxtLink>
          </template>
          <button
            v-else-if="!profile.blocked" type="button" class="btn" :class="following ? 'btn--ghost' : 'btn--primary'" :aria-pressed="following" :disabled="followBusy"
            @click="toggleFollow"
          >
            {{ following ? `✓ ${$t('follow.following')}` : `+ ${$t('follow.follow')}` }}
          </button>
          <button type="button" class="profile__icon-btn" :aria-label="$t('profile.share')" :title="$t('profile.share')" @click="shareProfile">
            <AppIcon name="share" />
          </button>
          <!-- Si apre verso l'alto: la scheda della testata taglia ciò che esce (angoli arrotondati del banner) -->
          <AppPopover v-if="!profile.isMe" v-model:open="menuOpen" role="group" align="end" placement="top" :label="$t('profile.more')">
            <template #trigger="{ toggle, attrs }">
              <button type="button" class="profile__icon-btn" :aria-label="$t('profile.more')" :title="$t('profile.more')" v-bind="attrs" @click="toggle">
                <AppIcon name="more" />
              </button>
            </template>
            <span class="profile__menu">
              <ReportButton :username="profile.username" class="profile__menu-item" />
              <button v-if="user" type="button" class="profile__menu-item profile__block" @click="toggleBlock">
                {{ profile.blocked ? $t('block.unblock') : confirmBlock ? $t('block.confirm') : $t('block.block') }}
              </button>
            </span>
          </AppPopover>
        </div>
        <p v-if="shareStatus" class="profile__sub" role="status">{{ shareStatus }}</p>
        <p v-if="profile.blocked && !profile.isMe" class="profile__blocked" role="status">🚫 {{ $t('block.active') }}</p>
      </header>

      <!-- Solo al proprietario: numeri e scorciatoie che agli altri non servono -->
      <section v-if="profile.isMe && !shelter" class="profile__mine" :aria-label="$t('profile.mine')">
        <dl class="profile__mine-stats">
          <div v-for="s in myStats" :key="s.label" class="profile__mine-stat"><dt>{{ s.label }}</dt><dd>{{ s.value }}</dd></div>
        </dl>
        <nav class="profile__mine-links">
          <NuxtLink v-if="HAS_ARTISTS" to="/account#artist">🎨 {{ profile.artist ? $t('artist.edit') : $t('artist.become') }}</NuxtLink>
          <NuxtLink v-if="user?.role === 'admin'" to="/admin">{{ $t('profile.admin') }}</NuxtLink>
        </nav>
      </section>

      <!-- Solo per chi gestisce il rifugio: tutto quello che serve, a un tocco -->
      <section v-if="profile.isMe && manage?.status === 'approved'" class="profile__card profile__manage" aria-labelledby="manage-title">
        <h2 id="manage-title" class="profile__manage-title">{{ $t('profile.manageTitle') }}</h2>
        <div class="profile__tiles">
          <NuxtLink to="/my-shelter#richieste" class="profile__tile" :class="{ 'profile__tile--hot': manage.newRequests }">
            <span class="profile__tile-icon" aria-hidden="true">📬</span>
            <b class="profile__tile-title">{{ $t('area.requests') }}</b>
            <small class="profile__tile-hint">{{ manage.newRequests ? $t('area.newCount', { n: manage.newRequests }) : $t('profile.noNewRequests') }}</small>
          </NuxtLink>
          <NuxtLink to="/my-shelter?modifica=1" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">🎨</span>
            <b class="profile__tile-title">{{ $t('profile.customize') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.customizeHint') }}</small>
          </NuxtLink>
          <NuxtLink to="/upload" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">➕</span>
            <b class="profile__tile-title">{{ $t('profile.addGuest') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.addGuestHint') }}</small>
          </NuxtLink>
          <NuxtLink :to="`/shelters/${manage.slug}`" class="profile__tile">
            <span class="profile__tile-icon" aria-hidden="true">👀</span>
            <b class="profile__tile-title">{{ $t('profile.publicPage') }}</b>
            <small class="profile__tile-hint">{{ $t('profile.publicPageHint') }}</small>
          </NuxtLink>
        </div>
        <p class="hint">💡 {{ $t('profile.adoptionHint') }}</p>
        <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="profile__admin-link">{{ $t('profile.admin') }} →</NuxtLink>
      </section>

      <NuxtLink v-else-if="profile.isMe && manage?.status === 'pending'" to="/my-shelter" class="profile__card profile__status">
        <span class="profile__status-icon" aria-hidden="true">⏳</span>
        <span class="profile__status-text"><b>{{ manage.name }} · {{ $t('area.pending') }}</b><small>{{ $t('profile.pendingShelter') }}</small></span>
      </NuxtLink>
      <NuxtLink v-else-if="profile.isMe && manage?.status === 'rejected'" to="/my-shelter" class="profile__card profile__status profile__status--warn">
        <span class="profile__status-icon" aria-hidden="true">✋</span>
        <span class="profile__status-text"><b>{{ manage.name }}</b><small>{{ $t('profile.rejectedShelter') }}</small></span>
      </NuxtLink>

      <p v-if="profile.isMe && pending" class="profile__notice">
        {{ $t('profile.pending', pending) }}
      </p>

      <!-- Siti con le sona: due schede, che restano in alto mentre si scorre -->
      <template v-if="sonaMode">
        <div v-if="tabs.length > 1" role="tablist" :aria-label="$t('sona.tabs.label')" class="profile__tabs">
          <button
            v-for="(k, i) in tabs" :id="`tab-${k}`" :key="k" ref="tabRefs" type="button" role="tab" class="profile__tab"
            :aria-selected="tab === k" :aria-controls="`panel-${k}`" :tabindex="tab === k ? 0 : -1"
            @click="tab = k" @keydown="onTabKey($event, i)"
          >
            {{ $t(`sona.tabs.${k}`) }} <span class="profile__tab-count">{{ tabCount(k) }}</span>
          </button>
        </div>

        <!-- Disegni dell'artista: per altri e per i suoi personaggi -->
        <section v-if="tab === 'art'" id="panel-art" role="tabpanel" aria-labelledby="tab-art" class="profile__panel">
          <div v-if="artOthers.length && artOwn.length" role="group" :aria-label="$t('sona.tabs.art')" class="profile__filter">
            <button type="button" class="chip" :aria-pressed="artFilter === 'all'" @click="artFilter = 'all'">{{ $t('sona.all') }}</button>
            <button type="button" class="chip" :aria-pressed="artFilter === 'others'" @click="artFilter = 'others'">{{ $t('sona.artOthers') }} <span class="profile__filter-count">{{ artOthers.length }}</span></button>
            <button type="button" class="chip" :aria-pressed="artFilter === 'own'" @click="artFilter = 'own'">{{ profile.isMe ? $t('sona.artOwnMine') : $t('sona.artOwn') }} <span class="profile__filter-count">{{ artOwn.length }}</span></button>
          </div>
          <ArtistWorks v-if="artItems.length" :artworks="artItems" :is-me="profile.isMe" :heading="false" @changed="refresh()" />
          <p v-else class="profile__empty">{{ $t('sona.artEmpty') }}</p>
          <p v-if="profile.isMe" class="hint">💡 {{ $t('sona.artHint') }}</p>
        </section>

        <!-- Personaggi: un indice; scheda, immagini e gestione stanno nella pagina di ognuno -->
        <section v-else-if="tab === 'characters'" id="panel-characters" role="tabpanel" aria-labelledby="tab-characters" class="profile__panel">
          <ul v-if="pets.length" class="profile__chars">
            <li v-for="p in pets" :key="p.id">
              <NuxtLink :to="entryUrl(p)" class="profile__char">
                <picture v-if="thumb(p)"><source v-for="s in photoSources(thumb(p), 'v', '(min-width: 760px) 240px, 46vw')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="thumb(p)" alt="" loading="lazy" class="profile__char-img"></picture>
                <span v-else class="profile__char-img profile__char-img--empty" aria-hidden="true">{{ p.name[0] }}</span>
                <span class="profile__char-text">
                  <b class="profile__char-name">{{ p.name }}</b>
                  <small class="profile__char-meta">{{ [p.sona?.species, p.sona?.pronouns, $t('sona.imageCount', { n: approvedCount(p) }, approvedCount(p))].filter(Boolean).join(' · ') }}</small>
                  <small v-if="profile.isMe && p.photos.some(ph => ph.status === 'pending')" class="profile__char-pending">{{ $t('sona.inReview', { n: p.photos.filter(ph => ph.status === 'pending').length }) }}</small>
                  <small v-else-if="p.badges[0]" class="profile__char-badge"><span aria-hidden="true">{{ p.badges[0].emoji }}</span> {{ $t(`badges.${p.badges[0].key}.name`) }}</small>
                </span>
              </NuxtLink>
            </li>
            <li v-if="profile.isMe">
              <p v-if="petsFull" class="profile__char profile__char--add profile__char--full">{{ $t('limits.petsFull', { max: limits.maxPets.value }) }}</p>
              <NuxtLink v-else to="/upload" class="profile__char profile__char--add">+ {{ $t('profile.newPet') }}</NuxtLink>
            </li>
          </ul>
          <div v-else class="profile__empty">
            <p>{{ profile.isMe ? $t('profile.noPetsMine') : $t('profile.noPets') }}</p>
            <NuxtLink v-if="profile.isMe" to="/upload" class="btn btn--primary btn--lg">{{ $t('profile.uploadFirst') }}</NuxtLink>
          </div>
        </section>

        <section v-else-if="tab === 'gallery'" id="panel-gallery" role="tabpanel" aria-labelledby="tab-gallery" class="profile__panel">
          <div v-if="pets.length > 1" role="group" :aria-label="$t('sona.pick')" class="profile__filter">
            <button type="button" class="chip" :aria-pressed="galleryFilter === 'all'" @click="galleryFilter = 'all'">{{ $t('sona.all') }}</button>
            <button v-for="p in pets" :key="p.id" type="button" class="chip" :aria-pressed="galleryFilter === p.id" @click="galleryFilter = p.id">{{ p.name }}</button>
          </div>
          <ul v-if="galleryItems.length" class="profile__grid">
            <li v-for="(g, i) in galleryItems" :key="g.id" class="profile__tile-art">
              <button type="button" class="profile__art-open" :aria-label="$t('pet.photoOf', { name: g.pet })" @click="viewing = i">
                <picture><source v-for="s in photoSources(g.image, 'v', '(min-width: 1040px) 240px, (min-width: 760px) 22vw, 46vw')" :key="s.type" v-bind="s"><img :src="g.image" alt="" loading="lazy" class="profile__art-img"></picture>
              </button>
              <p class="profile__art-meta">
                <NuxtLink :to="entryUrl({ owner: profile.username, name: g.pet })" class="profile__art-name">{{ g.pet }}</NuxtLink>
                <span v-if="g.credit">{{ $t('photo.credit', { text: g.credit.text }) }}</span>
              </p>
            </li>
          </ul>
          <p v-else class="profile__empty">{{ $t('sona.galleryEmpty') }}</p>
          <PhotoViewer v-model="viewing" :photos="viewerPhotos" />
        </section>
      </template>

      <template v-else>
      <ArtistWorks v-if="profile.artworks.length" :artworks="profile.artworks" :is-me="profile.isMe" class="profile__card" @changed="refresh()" />

      <template v-if="pets.length">
        <div id="pets" class="profile__bar">
          <h2 class="profile__pets-title">{{ shelter ? $t('profile.guestsTitle', { n: pets.length }) : $t('profile.petsTitle', { n: pets.length }) }}</h2>
          <div v-if="grouped && groups.length > 1" class="profile__filter" role="group" :aria-label="$t('profile.filter')">
            <button type="button" class="chip profile__filter-chip" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ $t('profile.all') }} <span class="profile__filter-count">{{ pets.length }}</span></button>
            <button v-for="g in groups" :key="g.id" type="button" class="chip profile__filter-chip" :aria-pressed="filter === g.id" @click="filter = g.id">
              <i class="profile__dot" :class="`profile__dot--${g.id}`" aria-hidden="true" />{{ $t(`profile.groups.${g.id}`) }} <span class="profile__filter-count">{{ g.pets.length }}</span>
            </button>
          </div>
        </div>

        <nav v-if="pets.length > 1" class="profile__index" :aria-label="$t('profile.jump')">
          <template v-for="g in visibleGroups" :key="g.id">
            <a v-for="p in g.pets" :key="p.id" :href="`#pet-${p.id}`" class="profile__index-link">
              <picture v-if="thumb(p)"><source v-for="s in photoSources(thumb(p), 's', '30px')" :key="s.type" v-bind="s"><img :src="thumb(p)" alt="" loading="lazy" class="profile__index-thumb"></picture>
              <span v-else class="profile__index-thumb profile__index-thumb--empty">{{ p.name[0] }}</span>
              {{ p.name }}
              <i v-if="p.adoptionInfo" class="profile__dot" :class="`profile__dot--${p.adoptionInfo.status}`" :title="$t(`adoption.status.${p.adoptionInfo.status}`)" />
            </a>
          </template>
        </nav>

        <section v-for="g in visibleGroups" :key="g.id" class="profile__group">
          <h3 v-if="grouped && filter === 'all' && groups.length > 1" class="profile__group-title" :class="`profile__group-title--${g.id}`">{{ $t(`profile.groups.${g.id}`) }} <span class="profile__group-count">{{ g.pets.length }}</span></h3>
          <PetGallery
            v-for="pet in g.pets" :id="`pet-${pet.id}`" :key="pet.id" :pet="pet"
            :editable="profile.isMe" link-title class="profile__pet" @changed="refresh()" @deleted="refresh()"
          />
        </section>
      </template>

      <div v-else class="profile__empty">
        <p>{{ profile.isMe ? $t('profile.noPetsMine') : $t('profile.noPets') }}</p>
        <NuxtLink v-if="profile.isMe" to="/upload" class="btn btn--primary btn--lg">{{ $t('profile.uploadFirst') }}</NuxtLink>
      </div>
      </template>

      <p v-if="!shelter" class="profile__since">{{ $t('profile.since', { date: since }) }}</p>
      <!-- Invito discreto per chi non gestisce ancora un rifugio -->
      <NuxtLink v-if="profile.isMe && !manage && features.shelters" to="/my-shelter" class="profile__become">🏠 {{ $t('profile.becomeShelter') }} →</NuxtLink>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Colore del pallino per stato di adozione
$adoption-dots: (
  available: var(--mint),
  fostered: var(--sun-deep),
  adopted: var(--heart),
);

// Pagina: profilo di un utente o di un rifugio
.profile {
  @include stack($space-6);
  padding-bottom: 12px;

  &__card { @include card(18px, $radius-xl); }

  // Testata
  &__hero {
    @include stack(16px);
    overflow: hidden;

    &--shelter { padding-top: 0; }
  }

  &__banner {
    margin: 0 -18px;
    height: clamp(90px, 22vw, 180px);
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--sun)));
  }

  &__cover { width: 100%; height: 100%; object-fit: cover; display: block; }

  &__id {
    display: flex;
    align-items: center;
    gap: $space-6;
    min-width: 0;

    // Solo il logo sale sul banner: il nome resta sotto, sullo sfondo della scheda
    .profile__hero--shelter & {
      align-items: flex-start;

      @include mq-down(sm) { flex-direction: column; gap: $space-3; }
    }
  }

  &__avatar {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    overflow: hidden;
    // Colore dei pulsanti: con la lettera bianca il contrasto resta buono anche nel tema scuro
    background: var(--action);
    color: #fff;
    font-family: var(--display);
    font-size: 30px;
    font-weight: 700;

    &--logo { width: 92px; height: 92px; margin-top: -46px; font-size: 40px; background: var(--accent); color: var(--accent-ink); border: 4px solid var(--surface); }
  }

  &__names {
    min-width: 0;
    @include stack(2px);
    align-items: flex-start;

    .profile__hero--shelter &,
    .profile__hero--banner & { padding-top: $space-2; }
  }

  &__title { font-size: 28px; overflow-wrap: anywhere; line-height: 1.1; text-wrap: balance; }

  &__sub {
    margin: 0;
    color: var(--muted);
    font-weight: 700;

    &--tagline { color: var(--ink); }
  }

  &__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: $space-2; margin: 0; }

  &__stat { background: var(--bg); border-radius: 16px; padding: 8px 10px; min-width: 0; display: flex; flex-direction: column-reverse; }

  &__stat-value { margin: 0; font-family: var(--display); font-weight: 700; font-size: 22px; color: var(--coral); font-variant-numeric: tabular-nums; }

  &__stat-label { @include eyebrow; }

  &__actions { display: flex; flex-wrap: wrap; align-items: center; gap: $space-3; }

  // Condividi e ⋯: tondi, 44px come gli altri bottoni
  &__icon-btn {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;

    &:hover, &:focus-visible, &[aria-expanded="true"] { border-color: var(--ink); }
  }

  // Menu ⋯: Segnala e Blocca, uno sotto l'altro
  &__menu { display: flex; flex-direction: column; align-items: stretch; gap: 2px; min-width: 150px; }

  &__menu-item {
    :deep(.report-button__open), &.profile__block {
      width: 100%;
      min-height: 40px;
      padding: 6px 8px;
      border: 0;
      border-radius: 8px;
      background: none;
      color: inherit;
      font: inherit;
      font-size: 14px;
      font-weight: 800;
      text-align: left;
      opacity: 1;
      cursor: pointer;

      &:hover, &:focus-visible { background: color-mix(in srgb, var(--bg) 18%, transparent); text-decoration: none; }
    }
  }

  &__links {
    @include cluster($space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link { padding: 6px 12px; font-size: 13px; }

  &__report { align-self: flex-end; display: flex; flex-wrap: wrap; gap: $space-2; color: var(--muted); }

  &__block {
    border: 0;
    padding: 4px 6px;
    background: none;
    color: inherit;
    opacity: .75;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;

    &:hover, &:focus-visible { opacity: 1; text-decoration: underline; }
  }

  // Commissioni aperte: un riquadro verde con il bottone per chiederle
  &__commissions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: 10px 10px 10px 14px;
    border-radius: $radius-md;
    background: color-mix(in srgb, var(--mint) 16%, var(--surface));
    // Su computer non a tutta larghezza: è un riquadro, non una barra
    max-width: 520px;
  }

  &__commissions-state { font-size: 15px; color: color-mix(in srgb, var(--mint) 45%, var(--ink)); }

  &__commissions-ask {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    border-radius: $radius-pill;
    // Testo bianco: verde scurito per restare sopra 4.5:1
    background: color-mix(in srgb, var(--mint) 55%, #000);
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    text-decoration: none;

    &:hover, &:focus-visible { background: color-mix(in srgb, var(--mint) 40%, #000); }
  }

  &__about { @include stack($space-1); align-items: flex-start; }

  &__bio {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    white-space: pre-line;
    overflow-wrap: anywhere;

    &.is-clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  }

  &__more {
    padding: 4px 0;
    min-height: 32px;
    border: 0;
    background: none;
    color: var(--link);
    font: inherit;
    font-weight: 900;
    font-size: 14px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  // Solo al proprietario: numeri in una riga e scorciatoie
  &__mine {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3 $space-6;
    padding: 10px 14px;
    border-radius: $radius-md;
    border: 2px dashed var(--line);
  }

  &__mine-stats { display: flex; flex-wrap: wrap; gap: $space-6; margin: 0; }

  &__mine-stat {
    display: flex;
    flex-direction: column-reverse;

    dt { @include eyebrow; }

    dd { margin: 0; font-family: var(--display); font-weight: 700; font-size: 20px; color: var(--coral); font-variant-numeric: tabular-nums; }
  }

  &__mine-links {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2 $space-5;

    a { color: var(--link); font-weight: 800; font-size: 14px; }
  }

  &__since { margin: 0; text-align: center; color: var(--muted); font-size: 13px; font-weight: 700; }

  // Schede (siti con le sona)
  // Restano in alto mentre si scorre: si cambia scheda senza tornare su
  &__tabs {
    position: sticky;
    top: 8px;
    z-index: 5;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    padding: 4px;
    border-radius: $radius-pill;
    background: var(--surface);
    box-shadow: 0 10px 24px -16px var(--shadow);
  }

  &__tab {
    min-height: 44px;
    border: 0;
    border-radius: $radius-pill;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;

    &[aria-selected="true"] { background: var(--ink); color: var(--bg); }
  }

  &__tab-count {
    color: var(--muted);
    font-weight: 700;

    [aria-selected="true"] > & { color: inherit; opacity: .75; }
  }

  &__panel { @include stack($space-6); }

  // Personaggi: una griglia di schede che portano alla pagina di ognuno
  &__chars {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(46%, 200px), 1fr));
    gap: $space-4;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__char {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: $radius-lg;
    overflow: hidden;
    background: var(--surface);
    box-shadow: $shadow-card;
    @include plain-link(var(--ink));

    &:hover .profile__char-name, &:focus-visible .profile__char-name { color: var(--link); }

    &--add {
      min-height: 180px;
      align-items: center;
      justify-content: center;
      padding: $space-5;
      background: transparent;
      box-shadow: none;
      border: 2px dashed var(--line);
      color: var(--link);
      font-weight: 900;
      text-align: center;
    }

    // Limite raggiunto: un avviso al posto di "Nuovo"
    &--full { margin: 0; color: var(--muted); font-size: 14px; font-weight: 700; line-height: 1.35; }
  }

  &__char-img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    background: var(--bg);

    &--empty { display: grid; place-items: center; font-family: var(--display); font-size: 40px; color: var(--muted); }
  }

  &__char-text { @include stack(1px); padding: 10px 12px 12px; min-width: 0; }

  &__char-name { font-family: var(--display); font-weight: 600; font-size: 18px; line-height: 1.15; overflow-wrap: anywhere; }

  &__char-meta { color: var(--muted); font-size: 13px; font-weight: 700; }

  &__char-badge, &__char-pending { font-size: 12px; font-weight: 800; color: var(--ink); }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(31%, 180px), 1fr));
    gap: $space-2;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__tile-art { @include stack($space-1); min-width: 0; }

  &__art-open { border: 0; padding: 0; background: none; cursor: zoom-in; border-radius: $radius-md; }

  &__art-img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: $radius-md; background: var(--bg); }

  &__art-meta {
    margin: 0;
    padding: 0 4px 4px;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
  }

  &__art-name { @include plain-link(var(--ink)); font-weight: 800; font-size: 14px; }

  &__blocked { margin: 0; color: var(--muted); font-size: 13px; font-weight: 700; }

  // Gestione del rifugio
  &__manage { @include stack($space-5); border: 2px solid var(--coral-soft); }

  &__manage-title { font-size: 20px; }

  &__tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: $space-3; }

  &__tile {
    position: relative;
    @include stack(2px);
    padding: 12px 14px;
    border-radius: $radius-md;
    min-width: 0;
    background: var(--bg);
    @include plain-link(var(--ink));
    border: 2px solid var(--line);

    &:hover { border-color: var(--coral); }

    &--hot { border-color: var(--action); background: var(--coral-soft); }
  }

  &__tile-icon { font-size: 22px; }

  &__tile-title { font-size: 15px; }

  &__tile-hint {
    color: var(--muted);
    font-weight: 700;
    font-size: 12px;

    .profile__tile--hot & { color: var(--coral-deep); font-weight: 900; }
  }

  &__admin-link { @include plain-link(var(--coral-deep)); font-weight: 800; font-size: 14px; }

  &__status {
    display: flex;
    align-items: center;
    gap: $space-5;
    @include plain-link(var(--ink));
    border: 2px solid var(--sun);

    &--warn { border-color: var(--coral); }
  }

  &__status-icon { font-size: 26px; }

  &__status-text {
    @include stack(2px);

    small { color: var(--muted); font-weight: 700; }
  }

  &__notice { margin: 0; padding: 12px 14px; border-radius: $radius-sm; background: var(--coral-soft); color: var(--ink); font-size: 14px; }

  &__bar { scroll-margin-top: 80px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: $space-4; margin-top: $space-2; }

  &__pets-title { font-size: 22px; }

  // Filtri: una fila che scorre sui telefoni invece di andare a capo
  &__filter {
    display: flex;
    gap: $space-2;
    @include scroll-row;

    > * { flex-shrink: 0; }

    @include mq(md) { flex-wrap: wrap; overflow: visible; }
  }

  &__filter-count {
    color: var(--muted);

    [aria-pressed="true"] > & { color: inherit; opacity: .7; }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
    flex: none;

    @each $status, $color in $adoption-dots {
      &--#{$status} { background: $color; }
    }
  }

  // Indice dei pet: una fila che scorre su mobile, a capo su desktop
  &__index {
    display: flex;
    gap: $space-3;
    @include scroll-row;
    margin: 0 -16px;
    padding: 2px 16px 4px;
    scroll-snap-type: x proximity;

    @include mq(md) { flex-wrap: wrap; overflow: visible; margin: 0; padding: 0; }
  }

  &__index-link {
    flex-shrink: 0;
    scroll-snap-align: start;
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    padding: 4px 12px 4px 4px;
    border-radius: $radius-pill;
    background: var(--surface);
    @include plain-link(var(--ink));
    font-weight: 800;
    font-size: 14px;
    box-shadow: $shadow-flat;
  }

  &__index-thumb {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;

    &--empty { display: grid; place-items: center; background: var(--line); font-size: 13px; }
  }

  &__group { @include stack($space-6); }

  &__group-title {
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-top: $space-1;

    &::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--muted); }

    @each $status, $color in $adoption-dots {
      &--#{$status}::before { background: $color; }
    }
  }

  &__group-count { color: var(--muted); font-size: 15px; }

  &__pet { scroll-margin-top: 80px; }

  &__empty { text-align: center; color: var(--muted); @include stack($space-4); align-items: center; padding: 30px 0; }

  &__become {
    align-self: center;
    @include plain-link(var(--muted));
    font-weight: 800;
    font-size: 14px;
    padding: $space-3;

    &:hover { color: var(--coral-deep); }
  }
}
</style>
