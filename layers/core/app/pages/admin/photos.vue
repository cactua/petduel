<script setup lang="ts">
import { CHALLENGE_REJECT_REASON, REJECT_REASONS, type ModerationItem } from '#shared/models'
import { speciesName } from '#shared/speciesNames'

type Reason = string

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Foto · Admin' })

const route = useRoute()
const tab = computed(() => (route.query.view === 'approved' ? 'approved' : 'pending'))
const { data: queue, refresh, error: loadError } = await useFetch<ModerationItem[]>('/api/admin/photos', {
  query: { status: tab },
})

// "Non in tema" solo per le foto inviate a una sfida
const reasonsFor = (item: ModerationItem) => REJECT_REASONS.filter(r => item.challenge || r !== CHALLENGE_REJECT_REASON)

// Motivo scelto per ogni foto: il pulsante Rifiuta si attiva solo dopo averlo scelto
const reason = reactive<Record<number, Reason | undefined>>({})
const busy = ref<number | null>(null)
const error = ref('')
const done = ref(0)

async function review(item: ModerationItem, action: 'approve' | 'reject' | 'remove', why = reason[item.id]) {
  if (action !== 'approve' && !why) return
  busy.value = item.id
  error.value = ''
  try {
    await $fetch(`/api/admin/photos/${item.id}`, { method: 'POST', body: action === 'approve' ? { action } : { action, reason: why } })
    queue.value = queue.value?.filter(q => q.id !== item.id) ?? []
    done.value++
    refreshNuxtData('admin-todo')
  }
  catch (e) {
    error.value = errorMessage(e)
    await refresh()
  }
  finally {
    busy.value = null
  }
}

// Approva tutte: due tocchi, il secondo conferma
const confirmAll = ref(false)
async function approveAll() {
  if (!confirmAll.value) {
    confirmAll.value = true
    return
  }
  confirmAll.value = false
  for (const item of [...(queue.value ?? [])]) await review(item, 'approve')
}

// Da tastiera, sulla prima foto della coda: A approva, 1-6 rifiuta con quel motivo
function onKey(e: KeyboardEvent) {
  if (tab.value !== 'pending' || busy.value !== null || e.metaKey || e.ctrlKey || e.altKey) return
  if ((e.target as HTMLElement).closest('input, textarea, select')) return
  const first = queue.value?.[0]
  if (!first) return
  if (e.key === 'a' || e.key === 'A') review(first, 'approve')
  const why = reasonsFor(first)[Number(e.key) - 1]
  if (why) review(first, 'reject', why)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const viewing = ref<number | null>(null)
const viewerPhotos = computed(() => (queue.value ?? []).map(q => ({ image: q.image, alt: `Foto di ${q.pet.name}` })))
</script>

<template>
  <section class="admin-page photo-review">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Foto</h1>
      <nav class="segmented" aria-label="Quali foto">
        <NuxtLink :to="{ query: {} }" class="segmented__option photo-review__tab" :class="{ 'is-active': tab === 'pending' }">In attesa</NuxtLink>
        <NuxtLink :to="{ query: { view: 'approved' } }" class="segmented__option photo-review__tab" :class="{ 'is-active': tab === 'approved' }">Approvate di recente</NuxtLink>
      </nav>
    </header>
    <p class="admin-page__lead">
      <template v-if="tab === 'pending'">
        Le foto diventano pubbliche solo dopo l'approvazione. Rifiutandole il file viene eliminato e il proprietario riceve un avviso col motivo.
        <span class="photo-review__keys">Tastiera: <kbd class="photo-review__kbd">A</kbd> approva la prima, un numero la rifiuta col motivo che ha quel numero.</span>
      </template>
      <template v-else>Per togliere una foto già pubblica (una segnalazione, un errore): scegli il motivo e rimuovila. Il proprietario riceve un avviso.</template>
    </p>
    <p v-if="error || loadError" class="error" role="alert">{{ error || 'Non riesco a caricare le foto' }}</p>

    <div v-if="tab === 'pending' && (queue?.length ?? 0) > 1" class="photo-review__bulk">
      <span v-if="done">{{ done }} {{ done === 1 ? 'fatta' : 'fatte' }} in questa sessione</span>
      <button type="button" class="photo-review__all" :class="{ 'is-armed': confirmAll }" :disabled="busy !== null" @click="approveAll">
        {{ confirmAll ? `Sicuro? Approva tutte e ${queue!.length}` : `Approva tutte (${queue!.length})` }}
      </button>
    </div>

    <p v-if="queue && !queue.length" class="admin-page__empty photo-review__empty">
      {{ tab === 'pending' ? 'Nessuna foto in attesa. 🎉' : 'Nessuna foto approvata di recente.' }}
    </p>

    <div class="admin-page__list">
      <article v-for="(item, i) in queue" :key="item.id" class="photo-review__item" :class="{ 'photo-review__item--first': i === 0 && tab === 'pending' }">
        <button type="button" class="photo-review__thumb" :aria-label="`Ingrandisci la foto di ${item.pet.name}`" @click="viewing = i">
          <picture><source v-for="s in photoSources(item.image, 'v', '140px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="item.image" :alt="`Foto di ${item.pet.name}`" class="photo-review__img"></picture>
        </button>
        <div class="photo-review__info">
          <h2 class="photo-review__name"><NuxtLink :to="entryUrl(item.pet.id)" class="photo-review__name-link">{{ item.pet.name }}</NuxtLink></h2>
          <p class="photo-review__line"><template v-if="item.pet.species">{{ speciesName(item.pet.species, 'one') }} · </template><NuxtLink :to="`/admin/users?q=${item.owner}`" class="photo-review__link">@{{ item.owner }}</NuxtLink></p>
          <p class="photo-review__line photo-review__line--small">
            {{ timeAgo(item.createdAt) }} · {{ item.pet.approvedPhotos ? `${item.pet.approvedPhotos} foto già approvate` : 'pet nuovo' }}
          </p>
          <p v-if="item.credit" class="photo-review__line">
            🎨 Artista: <a v-if="item.credit.url" :href="item.credit.url" target="_blank" rel="noopener noreferrer nofollow">{{ item.credit.text }}</a><template v-else>{{ item.credit.text }}</template>
          </p>
          <p v-if="item.challenge" class="photo-review__line photo-review__line--challenge">🏁 Per «{{ item.challenge }}»: è in tema?</p>
        </div>
        <div class="photo-review__reasons" role="radiogroup" :aria-label="`Motivo per ${item.pet.name}`">
          <button
            v-for="(r, n) in reasonsFor(item)" :key="r" type="button" role="radio" :aria-checked="reason[item.id] === r"
            class="photo-review__reason" :class="{ 'is-active': reason[item.id] === r }" @click="reason[item.id] = reason[item.id] === r ? undefined : r"
          >
            <kbd v-if="i === 0 && tab === 'pending'" class="photo-review__kbd">{{ n + 1 }}</kbd>{{ r }}
          </button>
        </div>
        <div class="admin-page__actions photo-review__actions">
          <button v-if="tab === 'pending'" type="button" class="btn btn--ok photo-review__button" :disabled="busy === item.id" @click="review(item, 'approve')">Approva</button>
          <button
            type="button" class="btn btn--primary photo-review__button photo-review__button--reject" :disabled="busy === item.id || !reason[item.id]"
            @click="review(item, tab === 'pending' ? 'reject' : 'remove')"
          >
            {{ reason[item.id] ? (tab === 'pending' ? 'Rifiuta' : 'Rimuovi') : 'Scegli un motivo' }}
          </button>
        </div>
      </article>
    </div>
    <PhotoViewer v-model="viewing" :photos="viewerPhotos" />
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: moderazione delle foto
.photo-review {
  &__tab { @include plain-link(var(--muted)); font-size: 13px; padding: 6px 12px; }

  &__keys {
    display: none;

    @media (hover: hover) and (min-width: 760px) { display: inline; }
  }

  &__kbd { font: 800 11px var(--body); background: var(--bg); border: 1px solid var(--line); border-radius: 5px; padding: 0 5px; margin-right: 5px; color: var(--ink); }

  &__bulk { display: flex; align-items: center; justify-content: flex-end; gap: $space-5; font-size: 13px; color: var(--muted); font-weight: 700; }

  &__all {
    border: 2px solid var(--mint);
    background: none;
    color: var(--mint);
    @include pill(7px, 14px);
    font-weight: 800;
    cursor: pointer;

    &.is-armed { background: color-mix(in srgb, var(--mint) 82%, #000); border-color: transparent; color: #fff; }
  }

  &__empty { text-align: center; padding: 30px 0; }

  // Foto e dati in alto, motivi e pulsanti a tutta larghezza sotto
  &__item {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    align-content: start;
    gap: 10px 12px;
    @include card($space-5, 24px);
    min-width: 0;

    &--first { outline: 3px solid var(--sun); }
  }

  &__thumb { border: 0; padding: 0; background: none; cursor: zoom-in; align-self: flex-start; flex-shrink: 0; }

  &__img { width: 110px; height: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 16px; display: block; }

  &__info { min-width: 0; @include stack($space-1); }

  &__name { font-size: 19px; }

  &__name-link { @include plain-link; }

  &__line {
    margin: 0;
    font-size: 14px;
    color: var(--muted);

    &--small { font-size: 12px; }

    &--challenge { color: var(--coral-deep); font-weight: 800; }
  }

  &__link { color: var(--coral-deep); font-weight: 700; }

  &__reasons { grid-column: 1 / -1; @include cluster($space-1); }

  &__reason {
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    @include pill(4px, 9px);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-align: left;

    &.is-active { background: var(--action); border-color: var(--action); color: #fff; }

    &.is-active .photo-review__kbd { background: transparent; color: #fff; border-color: rgba(255, 255, 255, .5); }
  }

  &__actions { grid-column: 1 / -1; align-self: end; }

  &__button {
    flex: 1;

    &--reject:disabled { background: var(--line); color: var(--muted); box-shadow: none; opacity: 1; }
  }
}
</style>
