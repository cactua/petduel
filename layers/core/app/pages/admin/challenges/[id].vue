<script setup lang="ts">
import type { AdminChallengeDetail, AdminChallengeList, ChallengeFields } from '#shared/models'

definePageMeta({ middleware: 'admin' })

// Modifica di una sfida: testi, traduzioni ed emoji sempre; la data finché non è iniziata;
// per chi è aperta finché nessuno partecipa. L'indirizzo pubblico resta lo stesso
const route = useRoute()
const id = computed(() => Number(route.params.id))
const { data: detail, error: loadError } = await useFetch<AdminChallengeDetail>(() => `/api/admin/challenges/${id.value}`)
const { data: list } = await useFetch<AdminChallengeList>('/api/admin/challenges', { default: () => ({ items: [], hasThemes: false }) })
useHead({ title: () => `${detail.value?.fields.title ?? 'Sfida'} · Admin` })

const STATUS = { active: 'In corso', upcoming: 'Programmata', ended: 'Conclusa' } as const

const dirty = ref(false)
useLeaveGuard(dirty)
const saving = ref(false)
const error = ref('')
const notice = useState<string>('admin-challenge-notice', () => '')

async function save(fields: ChallengeFields) {
  error.value = ''
  saving.value = true
  try {
    await $fetch(`/api/admin/challenges/${id.value}`, { method: 'PATCH', body: fields })
    notice.value = `Sfida “${fields.title}” aggiornata.`
    dirty.value = false
    await navigateTo('/admin/challenges')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    saving.value = false
  }
}

// Eliminare: solo senza partecipanti, con una seconda conferma
const confirmDelete = ref(false)
async function remove() {
  error.value = ''
  try {
    await $fetch(`/api/admin/challenges/${id.value}`, { method: 'DELETE' })
    notice.value = `Sfida “${detail.value!.fields.title}” eliminata.`
    dirty.value = false
    await navigateTo('/admin/challenges')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
}
</script>

<template>
  <section class="admin-page challenge-edit">
    <nav aria-label="Percorso">
      <NuxtLink to="/admin/challenges" class="admin-page__back">← Sfide</NuxtLink>
    </nav>
    <p v-if="loadError" class="error" role="alert">Sfida non trovata.</p>
    <template v-else-if="detail">
      <header class="admin-page__header challenge-edit__header">
        <h1 class="admin-page__title"><span aria-hidden="true">{{ detail.fields.emoji }}</span> {{ detail.fields.title }}</h1>
        <span class="challenge-edit__status" :class="`challenge-edit__status--${detail.status}`">{{ STATUS[detail.status] }}</span>
      </header>
      <p class="challenge-edit__meta">
        {{ detail.entries }} in gara
        <template v-if="detail.automatic"> · 🤖 dal calendario automatico: salvandola diventa tua e non viene più sostituita</template>
        · <NuxtLink :to="`/challenges/${detail.slug}`" class="challenge-edit__public">Pagina pubblica</NuxtLink>
      </p>
      <ChallengeForm
        :initial="detail.fields" :others="list.items" :self-id="detail.id" :lock-date="detail.status !== 'upcoming'" :lock-audience="detail.entries > 0"
        :saving="saving" :error="error" submit-label="Salva le modifiche"
        @save="save" @dirty="dirty = $event" @cancel="navigateTo('/admin/challenges')"
      />
      <section v-if="!detail.entries" class="challenge-edit__danger" aria-labelledby="ce-danger">
        <h2 id="ce-danger" class="challenge-edit__danger-title">Elimina la sfida</h2>
        <p>Si può eliminare finché nessuno partecipa. Non si torna indietro.</p>
        <div class="challenge-edit__danger-actions">
          <template v-if="confirmDelete">
            <button type="button" class="btn btn--danger" @click="remove">Sì, elimina</button>
            <button type="button" class="btn btn--ghost" @click="confirmDelete = false">Annulla</button>
          </template>
          <button v-else type="button" class="btn btn--ghost challenge-edit__delete" @click="confirmDelete = true">Elimina…</button>
        </div>
      </section>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: modifica di una sfida
.challenge-edit {
  &__header { flex-wrap: wrap; justify-content: flex-start; gap: $space-3; }

  &__status {
    padding: 3px 12px;
    border-radius: $radius-pill;
    font-size: 13px;
    font-weight: 800;
    background: color-mix(in srgb, var(--line) 60%, var(--surface));

    &--active { background: color-mix(in srgb, var(--mint) 22%, var(--surface)); }

    &--upcoming { background: color-mix(in srgb, var(--sun) 35%, var(--surface)); }
  }

  &__meta { margin: 0; color: var(--muted); font-size: 14px; font-weight: 700; }

  &__public { color: var(--link); }

  &__danger {
    @include stack($space-2);
    max-width: 620px;
    padding: 16px 18px;
    border-radius: $radius-lg;
    border: 2px dashed color-mix(in srgb, var(--coral) 45%, var(--line));

    p { margin: 0; color: var(--muted); font-size: 14px; }
  }

  &__danger-title { margin: 0; font-size: 17px; }

  &__danger-actions { display: flex; flex-wrap: wrap; gap: $space-2; }

  &__delete { color: var(--link); }
}
</style>
