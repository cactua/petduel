<script setup lang="ts">
import type { ShelterReviewItem } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Rifugi · Admin' })

const { data, refresh, error: loadError } = await useFetch<{ pending: ShelterReviewItem[], approved: ShelterReviewItem[] }>('/api/admin/shelters')
const reason = reactive<Record<number, string>>({})
const busy = ref<number | null>(null)
const error = ref('')
// Per rifiutare o revocare si apre prima il campo del motivo
const asking = ref<{ id: number, action: 'reject' | 'revoke' } | null>(null)

async function review(item: ShelterReviewItem, action: 'approve' | 'reject' | 'revoke') {
  if (action !== 'approve' && (asking.value?.id !== item.id || asking.value.action !== action)) {
    asking.value = { id: item.id, action }
    return
  }
  busy.value = item.id
  error.value = ''
  try {
    await $fetch(`/api/admin/shelters/${item.id}`, {
      method: 'POST',
      body: action === 'approve' ? { action } : { action, reason: reason[item.id] ?? '' },
    })
    asking.value = null
    await refresh()
    refreshNuxtData('admin-todo')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = null
  }
}
const when = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { dateStyle: 'medium' })
</script>

<template>
  <section class="admin-page shelter-review">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Verifica rifugi</h1>
    </header>
    <p class="admin-page__lead">
      Prima di approvare controlla che l'associazione esista davvero: cerca il codice fiscale o la partita IVA,
      il sito e i social, e se hai dubbi scrivi all'email indicata. Un rifugio verificato può mettere il nastrino "Cerca casa" ai suoi pet.
    </p>
    <p v-if="error || loadError" class="error" role="alert">{{ error || 'Non riesco a caricare i rifugi' }}</p>

    <h2 class="admin-page__heading">Da verificare</h2>
    <p v-if="data && !data.pending.length" class="admin-page__empty">Nessuna richiesta in attesa. 🎉</p>
    <div class="admin-page__list">
      <article v-for="s in data?.pending" :key="s.id" class="admin-page__item">
        <h3 class="shelter-review__name">{{ s.name }}</h3>
        <p class="shelter-review__meta">📍 {{ s.city }} · da <NuxtLink :to="`/u/${s.owner}`" class="shelter-review__link">@{{ s.owner }}</NuxtLink> · {{ when(s.createdAt) }}</p>
        <p class="shelter-review__desc">{{ s.description }}</p>
        <dl class="shelter-review__facts">
          <dt>Codice fiscale / P.IVA</dt><dd><code>{{ s.taxCode }}</code></dd>
          <dt>Email</dt><dd>{{ s.contactEmail }}</dd>
          <dt v-if="s.phone">Telefono</dt><dd v-if="s.phone">{{ s.phone }}</dd>
          <dt v-if="s.website">Sito</dt><dd v-if="s.website"><a :href="s.website" target="_blank" rel="noopener noreferrer nofollow" class="shelter-review__link">{{ s.website }}</a></dd>
        </dl>
        <input
          v-if="asking?.id === s.id" v-model="reason[s.id]" maxlength="200" class="input"
          placeholder="Motivo del rifiuto (lo vede il rifugio)" aria-label="Motivo del rifiuto"
        >
        <div class="admin-page__actions">
          <button type="button" class="btn btn--ok shelter-review__button" :disabled="busy === s.id" @click="review(s, 'approve')">Approva</button>
          <button type="button" class="btn btn--primary shelter-review__button" :disabled="busy === s.id" @click="review(s, 'reject')">{{ asking?.id === s.id ? 'Conferma rifiuto' : 'Rifiuta' }}</button>
        </div>
      </article>
    </div>

    <h2 class="admin-page__heading">Verificati</h2>
    <p v-if="data && !data.approved.length" class="admin-page__empty">Ancora nessun rifugio verificato.</p>
    <div class="admin-page__list">
      <article v-for="s in data?.approved" :key="s.id" class="admin-page__item">
        <h3 class="shelter-review__name"><NuxtLink :to="`/rifugi/${s.slug}`" class="shelter-review__name-link">{{ s.name }}</NuxtLink></h3>
        <p class="shelter-review__meta">📍 {{ s.city }} · @{{ s.owner }} · <code>{{ s.taxCode }}</code></p>
        <input
          v-if="asking?.id === s.id" v-model="reason[s.id]" maxlength="200" class="input"
          placeholder="Motivo della revoca" aria-label="Motivo della revoca"
        >
        <button type="button" class="btn btn--danger shelter-review__revoke" :disabled="busy === s.id" @click="review(s, 'revoke')">
          {{ asking?.id === s.id ? 'Conferma: togli la verifica e i nastrini' : 'Revoca verifica' }}
        </button>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: verifica dei rifugi
.shelter-review {
  &__name { font-size: 19px; }

  &__name-link { color: inherit; }

  &__meta { margin: 0; color: var(--muted); font-size: 14px; font-weight: 700; }

  &__link { color: var(--coral-deep); }

  &__desc { margin: 0; font-size: 14px; white-space: pre-line; overflow-wrap: anywhere; }

  &__facts {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    font-size: 14px;

    dt { color: var(--muted); font-weight: 700; }

    dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  }

  &__button { flex: 1; }

  &__revoke { align-self: flex-start; }
}
</style>
