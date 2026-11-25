<script setup lang="ts">
import { SPECIES, TRANSLATED_LOCALES, challengeFieldsSchema, type ChallengeFields, type ChallengeList, type ChallengeSummary, type Species } from '#shared/models'
import { LANGUAGES } from '../../../i18n/languages'
import { speciesName } from '#shared/speciesNames'

const { features } = useAppConfig()

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Sfide · Admin' })

const { data, refresh } = await useFetch<ChallengeList>('/api/challenges')

// Lunedì prossimo come data proposta
function nextMonday() {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return d.toLocaleDateString('sv-SE')
}

// Le altre lingue, ognuna col suo titolo e la sua descrizione
const otherLanguages = LANGUAGES.filter(l => (TRANSLATED_LOCALES as string[]).includes(l.code))
const emptyTranslations = () => Object.fromEntries(TRANSLATED_LOCALES.map(c => [c, { title: '', description: '' }]))

const blank = () => ({ title: '', description: '', translations: emptyTranslations(), emoji: '', species: null as Species | null, adoptionOnly: false, startDate: nextMonday() })
const form = reactive(blank())
const error = ref('')
const notice = ref('')
const sending = ref(false)

// Sfida in modifica: lo stesso modulo, riempito con i suoi campi. La data si blocca quando è iniziata,
// specie e "solo rifugi" quando ha partecipanti
const editing = ref<{ id: number, title: string, started: boolean, entries: number } | null>(null)
const formEl = ref<HTMLFormElement>()
const loadingId = ref<number | null>(null)

async function edit(c: ChallengeSummary) {
  error.value = ''
  notice.value = ''
  loadingId.value = c.id
  try {
    const fields = await $fetch<ChallengeFields & { started: boolean }>(`/api/admin/challenges/${c.id}`)
    const { started, ...rest } = fields
    Object.assign(form, blank(), rest, { translations: { ...emptyTranslations(), ...rest.translations } })
    editing.value = { id: c.id, title: c.title, started, entries: c.entries }
    await nextTick()
    formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formEl.value?.querySelector<HTMLInputElement>('#c-title')?.focus({ preventScroll: true })
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    loadingId.value = null
  }
}

function cancelEdit() {
  editing.value = null
  error.value = ''
  Object.assign(form, blank())
}

async function create() {
  error.value = ''
  notice.value = ''
  const check = challengeFieldsSchema.safeParse(form)
  if (!check.success) {
    const issue = check.error.issues[0]
    // Per le traduzioni si dice quale lingua manca ("English: Titolo troppo corto")
    const lang = issue?.path[0] === 'translations' ? LANGUAGES.find(l => l.code === issue.path[1])?.name : undefined
    error.value = `${lang ? `${lang}: ` : ''}${issue?.message ?? 'Controlla i campi'}`
    return
  }
  sending.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/admin/challenges/${editing.value.id}`, { method: 'PATCH', body: check.data })
      notice.value = `Sfida “${check.data.title}” aggiornata.`
      editing.value = null
      Object.assign(form, blank())
      await refresh()
      return
    }
    const res = await $fetch<{ slug: string, overlapping: number }>('/api/admin/challenges', { method: 'POST', body: check.data })
    notice.value = res.overlapping
      ? `Sfida creata. Nello stesso periodo ci sono altre ${res.overlapping} sfide: si giocheranno in parallelo.`
      : 'Sfida creata.'
    Object.assign(form, { title: '', description: '', translations: emptyTranslations(), emoji: '', species: null, adoptionOnly: false })
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}

const confirming = ref<number | null>(null)
async function remove(c: ChallengeSummary) {
  if (confirming.value !== c.id) {
    confirming.value = c.id
    return
  }
  confirming.value = null
  try {
    await $fetch(`/api/admin/challenges/${c.id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
}

const scheduled = computed(() => [...(data.value?.current ?? []), ...(data.value?.upcoming ?? [])])
</script>

<template>
  <section class="admin-page challenge-admin">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Sfide</h1>
    </header>
    <p class="admin-page__lead">
      Se non programmi nulla, ogni lunedì parte in automatico il tema successivo del calendario.
      Una sfida creata qui sostituisce quella automatica dello stesso periodo, se non ha ancora partecipanti.
    </p>

    <h2 class="admin-page__heading">In corso e programmate</h2>
    <div class="challenge-admin__list">
      <div v-for="c in scheduled" :key="c.id" class="challenge-admin__item">
        <ChallengeCard :challenge="c" />
        <div class="challenge-admin__actions">
          <button type="button" class="btn btn--ghost btn--sm" :aria-label="`Modifica ${c.title}`" :aria-pressed="editing?.id === c.id" :disabled="loadingId === c.id" @click="edit(c)">
            {{ editing?.id === c.id ? 'In modifica' : 'Modifica' }}
          </button>
          <button v-if="!c.entries" type="button" class="btn btn--danger btn--sm" @click="remove(c)">
            {{ confirming === c.id ? 'Conferma eliminazione' : 'Elimina' }}
          </button>
        </div>
      </div>
    </div>

    <h2 id="c-form-title" class="admin-page__heading">{{ editing ? `Modifica: ${editing.title}` : 'Nuova sfida' }}</h2>
    <form ref="formEl" class="challenge-admin__form" aria-labelledby="c-form-title" novalidate @submit.prevent="create">
      <p v-if="editing && (editing.started || editing.entries)" class="challenge-admin__lock">
        {{ editing.started ? 'È già iniziata: la data resta quella.' : '' }}
        {{ editing.entries ? 'Ha già partecipanti: specie e rifugi restano quelli.' : '' }}
        Titolo, descrizione, traduzioni ed emoji si possono sempre cambiare; l'indirizzo della sfida non cambia.
      </p>
      <div class="challenge-admin__row">
        <div class="field challenge-admin__emoji">
          <label for="c-emoji" class="label">Emoji</label>
          <input id="c-emoji" v-model="form.emoji" maxlength="16" placeholder="🎃" class="input challenge-admin__emoji-input">
        </div>
        <div class="field challenge-admin__grow">
          <label for="c-title" class="label">Titolo (italiano)</label>
          <input id="c-title" v-model="form.title" maxlength="60" placeholder="Il travestimento più bello" class="input">
        </div>
      </div>
      <label for="c-desc" class="label">Descrizione in italiano (cosa deve mostrare la foto)</label>
      <textarea id="c-desc" v-model="form.description" maxlength="200" rows="2" placeholder="Costumi, cappellini e mantelli: il pet più elegante di Halloween." class="input" />
      <fieldset v-for="lang in otherLanguages" :key="lang.code" class="challenge-admin__lang" :lang="lang.code">
        <legend class="challenge-admin__lang-name">{{ lang.name }}</legend>
        <label :for="`c-title-${lang.code}`" class="label">Titolo</label>
        <input :id="`c-title-${lang.code}`" v-model="form.translations[lang.code]!.title" maxlength="60" class="input">
        <label :for="`c-desc-${lang.code}`" class="label">Descrizione</label>
        <textarea :id="`c-desc-${lang.code}`" v-model="form.translations[lang.code]!.description" maxlength="200" rows="2" class="input" />
      </fieldset>
      <div class="challenge-admin__row">
        <div v-if="SPECIES.length" class="field challenge-admin__grow">
          <label for="c-species" class="label">Per chi</label>
          <select id="c-species" v-model="form.species" class="input" :disabled="!!editing?.entries">
            <option :value="null">Tutte le specie</option>
            <option v-for="s in SPECIES" :key="s" :value="s">Solo {{ speciesName(s, 'many').toLowerCase() }}</option>
          </select>
        </div>
        <div class="field challenge-admin__grow">
          <label for="c-start" class="label">Inizio (dura 7 giorni)</label>
          <input id="c-start" v-model="form.startDate" type="date" class="input" :disabled="editing?.started">
        </div>
      </div>
      <label v-if="features.shelters" class="label challenge-admin__check"><input v-model="form.adoptionOnly" type="checkbox" class="challenge-admin__checkbox" :disabled="!!editing?.entries"> Solo per i pet dei rifugi che cercano casa</label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="notice" class="admin-page__notice" role="status">{{ notice }}</p>
      <div class="challenge-admin__submit">
        <button type="submit" class="btn btn--primary btn--lg" :disabled="sending">{{ sending ? 'Salvataggio…' : editing ? 'Salva le modifiche' : 'Programma la sfida' }}</button>
        <button v-if="editing" type="button" class="btn btn--ghost btn--lg" @click="cancelEdit">Annulla</button>
      </div>
    </form>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: sfide programmate e creazione di una nuova
.challenge-admin {
  &__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: $space-4; }

  &__item { @include stack($space-2); }

  &__actions { @include cluster($space-2); }

  &__lock { margin: 0 0 $space-2; padding: $space-3 $space-4; border-radius: $radius-md; background: color-mix(in srgb, var(--line) 50%, var(--surface)); font-size: 14px; }

  &__form { @include card(18px, 24px); @include stack($space-2); max-width: 620px; }

  &__row { display: flex; gap: $space-4; flex-wrap: wrap; }

  &__grow { flex: 1 1 200px; }

  &__emoji { width: 80px; }

  &__emoji-input { text-align: center; font-size: 20px; padding: 7px; }

  &__lang { @include stack($space-2); margin: $space-2 0 0; padding: $space-3 $space-4 $space-4; border: 1px solid var(--line); border-radius: $radius-md; }

  &__lang-name { padding: 0 $space-2; font-weight: 700; }

  &__check { display: flex; align-items: center; gap: $space-3; margin-top: $space-1; }

  &__checkbox { width: 20px; height: 20px; margin: 0; padding: 0; accent-color: var(--coral); }

  &__submit { @include cluster($space-3); margin-top: $space-3; }
}
</style>
