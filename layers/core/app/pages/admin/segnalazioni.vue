<script setup lang="ts">
import { REJECT_REASONS, type ReportGroup, type ReportReason } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Segnalazioni · Admin' })

const { data: queue, refresh, error: loadError } = await useFetch<ReportGroup[]>('/api/admin/reports')

const REASON_LABEL: Record<ReportReason, string> = {
  stolen: 'Presa senza permesso',
  explicit: 'Esplicita o inappropriata',
  hateful: 'Offensiva o d\'odio',
  personal: 'Dati personali',
  spam: 'Spam',
  impersonation: 'Si spaccia per qualcun altro',
  other: 'Altro',
}
// Motivo di rimozione proposto (quello che legge il proprietario), dal motivo della segnalazione
const SUGGESTED: Partial<Record<ReportReason, number>> = { stolen: 3, explicit: 1, hateful: 1, personal: 4 }

const key = (g: ReportGroup) => `${g.target}${g.id}`
const reason = reactive<Record<string, string | undefined>>({})
watch(queue, (q) => {
  for (const g of q ?? []) {
    const first = g.reports.find(r => SUGGESTED[r.reason] !== undefined)
    reason[key(g)] ??= first ? REJECT_REASONS[SUGGESTED[first.reason]!] : undefined
  }
}, { immediate: true })

const busy = ref<string | null>(null)
const error = ref('')

async function decide(g: ReportGroup, action: 'dismiss' | 'remove' | 'ban') {
  busy.value = key(g)
  error.value = ''
  try {
    await $fetch('/api/admin/reports', {
      method: 'POST',
      body: { action, target: g.target, id: g.id, ...(action === 'remove' ? { reason: reason[key(g)] } : {}) },
    })
    queue.value = queue.value?.filter(q => key(q) !== key(g)) ?? []
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

// Conteggio dei motivi di una voce, es. "Presa senza permesso ×3"
const reasonCounts = (g: ReportGroup) => Object.entries(
  g.reports.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] ?? 0) + 1 }), {}),
).map(([r, n]) => `${REASON_LABEL[r as ReportReason]}${n > 1 ? ` ×${n}` : ''}`)

const viewing = ref<number | null>(null)
const photoGroups = computed(() => (queue.value ?? []).filter(g => g.photo))
const viewerPhotos = computed(() => photoGroups.value.map(g => ({ image: g.photo!.image, alt: `Immagine di ${g.photo!.petName}` })))
</script>

<template>
  <section class="admin-page report-review">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Segnalazioni</h1>
    </header>
    <p class="admin-page__lead">
      Immagini e profili segnalati dagli utenti, prima quelli che l'artista dice di non aver autorizzato.
      Chi ha segnalato riceve un avviso quando decidi, senza sapere cosa è successo all'altra persona.
    </p>
    <p v-if="error || loadError" class="error" role="alert">{{ error || 'Non riesco a caricare le segnalazioni' }}</p>
    <p v-if="queue && !queue.length" class="admin-page__empty report-review__empty">Nessuna segnalazione aperta. 🎉</p>

    <div class="admin-page__list">
      <article v-for="g in queue" :key="key(g)" class="report-review__item" :class="{ 'report-review__item--artist': g.reports.some(r => r.byArtist) }">
        <button
          v-if="g.photo" type="button" class="report-review__thumb" :aria-label="`Ingrandisci l'immagine di ${g.photo.petName}`"
          @click="viewing = photoGroups.indexOf(g)"
        >
          <picture><source v-for="s in photoSources(g.photo.image, 'v', '110px')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="g.photo.image" :alt="`Immagine di ${g.photo.petName}`" class="report-review__img"></picture>
        </button>
        <span v-else class="report-review__avatar" aria-hidden="true">{{ g.user?.username[0]?.toUpperCase() }}</span>

        <div class="report-review__info">
          <template v-if="g.photo">
            <h2 class="report-review__name"><NuxtLink :to="`/pet/${g.photo.petId}`" class="report-review__name-link">{{ g.photo.petName }}</NuxtLink></h2>
            <p class="report-review__line">di <NuxtLink :to="`/admin/utenti?q=${g.photo.owner}`" class="report-review__link">@{{ g.photo.owner }}</NuxtLink></p>
            <p v-if="g.photo.credit" class="report-review__line">🎨 Artista: {{ g.photo.credit.text }}</p>
          </template>
          <template v-else-if="g.user">
            <h2 class="report-review__name"><NuxtLink :to="`/u/${g.user.username}`" class="report-review__name-link">@{{ g.user.username }}</NuxtLink></h2>
            <p v-if="g.user.banned" class="report-review__line">Già sospeso</p>
            <p v-for="l in g.user.artistLinks" :key="l" class="report-review__line report-review__line--small">🔗 {{ l }}</p>
          </template>
          <p class="report-review__reasons">
            <span v-for="c in reasonCounts(g)" :key="c" class="badge badge--soft">{{ c }}</span>
          </p>
        </div>

        <ul class="report-review__reports">
          <li v-for="(r, n) in g.reports" :key="n" class="report-review__report">
            <b v-if="r.byArtist" class="report-review__artist">🎨 Dall'artista indicato</b>
            <span class="report-review__line report-review__line--small">@{{ r.reporter }} · {{ timeAgo(r.createdAt) }} · {{ REASON_LABEL[r.reason] }}</span>
            <q v-if="r.note" class="report-review__note">{{ r.note }}</q>
          </li>
        </ul>

        <div v-if="g.photo" class="report-review__choice">
          <label :for="`why-${key(g)}`" class="label">Motivo per il proprietario</label>
          <select :id="`why-${key(g)}`" v-model="reason[key(g)]" class="input">
            <option :value="undefined" disabled>Scegli un motivo</option>
            <option v-for="r in REJECT_REASONS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="admin-page__actions report-review__actions">
          <button type="button" class="btn btn--ghost" :disabled="busy === key(g)" @click="decide(g, 'dismiss')">Va bene così</button>
          <button
            v-if="g.photo" type="button" class="btn btn--primary" :disabled="busy === key(g) || !reason[key(g)]"
            @click="decide(g, 'remove')"
          >
            Togli l'immagine
          </button>
          <button v-else-if="g.user && !g.user.banned" type="button" class="btn btn--primary" :disabled="busy === key(g)" @click="decide(g, 'ban')">Sospendi</button>
        </div>
      </article>
    </div>
    <PhotoViewer v-model="viewing" :photos="viewerPhotos" />
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: segnalazioni degli utenti
.report-review {
  &__empty { text-align: center; padding: 30px 0; }

  &__item {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    align-content: start;
    gap: 10px 12px;
    @include card($space-5, 24px);
    min-width: 0;

    &--artist { outline: 3px solid var(--sun); }
  }

  &__thumb { border: 0; padding: 0; background: none; cursor: zoom-in; align-self: flex-start; }

  &__img { width: 90px; height: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 14px; display: block; }

  &__avatar {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--coral-soft);
    font-family: var(--display);
    font-size: 28px;
  }

  &__info { min-width: 0; @include stack($space-1); }

  &__name { font-size: 19px; overflow-wrap: anywhere; }

  &__name-link { @include plain-link; }

  &__link { color: var(--coral-deep); font-weight: 700; }

  &__line {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
    overflow-wrap: anywhere;

    &--small { font-size: 12px; }
  }

  &__reasons { @include cluster($space-2); margin: $space-2 0 0; }

  &__reports, &__choice, &__actions { grid-column: 1 / -1; }

  &__reports {
    @include stack($space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__report { @include stack(2px); padding: 8px 10px; border-radius: $radius-md; background: var(--bg); }

  &__artist { color: var(--coral-deep); font-size: 13px; }

  &__note { font-size: 14px; overflow-wrap: anywhere; }

  &__choice { @include stack($space-2); }
}
</style>
