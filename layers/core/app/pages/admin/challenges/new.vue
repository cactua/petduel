<script setup lang="ts">
import { TRANSLATED_LOCALES, type AdminChallengeList, type ChallengeFields } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Nuova sfida · Admin' })

// Nuova sfida. Dal calendario si arriva con ?start=AAAA-MM-GG, la settimana scelta; altrimenti lunedì prossimo
const route = useRoute()
const { data: list } = await useFetch<AdminChallengeList>('/api/admin/challenges', { default: () => ({ items: [], hasThemes: false }) })

function nextMonday() {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return d.toLocaleDateString('sv-SE')
}
const start = typeof route.query.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.start) ? route.query.start : nextMonday()
const initial: ChallengeFields = {
  title: '',
  description: '',
  translations: Object.fromEntries(TRANSLATED_LOCALES.map(c => [c, { title: '', description: '' }])),
  emoji: '',
  species: null,
  adoptionOnly: false,
  startDate: start,
}

const dirty = ref(false)
useLeaveGuard(dirty)
const saving = ref(false)
const error = ref('')
const notice = useState<string>('admin-challenge-notice', () => '')

async function save(fields: ChallengeFields) {
  error.value = ''
  saving.value = true
  try {
    const res = await $fetch<{ slug: string, overlapping: number }>('/api/admin/challenges', { method: 'POST', body: fields })
    notice.value = res.overlapping
      ? `Sfida “${fields.title}” programmata. Nella stessa settimana ci sono altre ${res.overlapping} sfide: si giocheranno in parallelo.`
      : `Sfida “${fields.title}” programmata.`
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
</script>

<template>
  <section class="admin-page">
    <nav aria-label="Percorso">
      <NuxtLink to="/admin/challenges" class="admin-page__back">← Sfide</NuxtLink>
    </nav>
    <header class="admin-page__header">
      <h1 class="admin-page__title">Nuova sfida</h1>
    </header>
    <ChallengeForm
      :initial="initial" :others="list.items" :saving="saving" :error="error" submit-label="Programma la sfida"
      @save="save" @dirty="dirty = $event" @cancel="navigateTo('/admin/challenges')"
    />
  </section>
</template>
