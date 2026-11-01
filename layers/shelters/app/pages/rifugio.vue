<script setup lang="ts">
import { shelterFieldsSchema, type AdoptionRequestItem, type MyShelter, type RequestStatus } from '#shared/models'

definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => `${t('area.title')}` })

const { user } = useUserSession()
const { data, refresh } = await useFetch<MyShelter>('/api/shelters/me')
const shelter = computed(() => data.value?.shelter ?? null)

// --- Richiesta di verifica (anche dopo un rifiuto, con i dati di prima) ---
const form = reactive({ name: '', city: '', description: '', website: '', taxCode: '', contactEmail: '', phone: '' })
watchEffect(() => {
  const s = shelter.value
  if (s && s.status === 'rejected') {
    Object.assign(form, { name: s.name, city: s.city, description: s.description, website: s.website, taxCode: s.taxCode, contactEmail: s.contactEmail, phone: s.phone })
  }
})
const error = ref('')
const notice = ref('')
const sending = ref(false)

async function apply() {
  error.value = ''
  const check = shelterFieldsSchema.safeParse(form)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  try {
    await $fetch('/api/shelters', { method: 'POST', body: check.data })
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}

// --- Rifugio verificato: la pagina pubblica si personalizza da qui ---
// Dal profilo si arriva con ?modifica=1: il modulo è già aperto
const route = useRoute()
const editing = ref(route.query.modifica === '1' && shelter.value?.status === 'approved')
function startEdit() {
  notice.value = ''
  editing.value = true
}
async function onSaved() {
  editing.value = false
  notice.value = t('area.updated')
  await refresh()
}

// --- Richieste di adozione ---
const filter = ref<'open' | 'closed'>('open')
const requests = computed(() => (data.value?.requests ?? []).filter(r => (filter.value === 'closed') === (r.status === 'closed')))
const newCount = computed(() => data.value?.requests.filter(r => r.status === 'new').length ?? 0)

async function setStatus(r: AdoptionRequestItem, status: RequestStatus) {
  try {
    await $fetch(`/api/adoption-requests/${r.id}`, { method: 'PATCH', body: { status } })
    r.status = status
  }
  catch (e) {
    error.value = errorMessage(e)
  }
}
// Chiude il rifugio (o ritira la richiesta): i pet restano, senza scheda di adozione
const closing = ref(false)
async function close() {
  if (!closing.value) {
    closing.value = true
    return
  }
  try {
    await $fetch('/api/shelters/me', { method: 'DELETE' })
    closing.value = false
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
}

const when = (iso: string) => new Date(iso).toLocaleString(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <section class="shelter-area">
    <h1 class="shelter-area__title">{{ $t('area.title') }}</h1>

    <!-- Verificato -->
    <template v-if="shelter?.status === 'approved'">
      <div class="shelter-area__box">
        <div class="shelter-area__head">
          <div>
            <span class="badge badge--ok">✓ {{ $t('area.verified') }}</span>
            <h2 class="shelter-area__name">{{ shelter.name }}</h2>
            <p class="u-muted">📍 {{ shelter.city }} · {{ $t('shelters.available', { n: shelter.available }) }} · {{ $t('shelters.adopted', { n: shelter.adopted }) }}</p>
          </div>
          <NuxtLink :to="`/rifugi/${shelter.slug}`" class="btn btn--ghost">{{ $t('area.publicPage') }}</NuxtLink>
        </div>
        <ol class="shelter-area__steps">
          <i18n-t keypath="area.step1" tag="li"><template #upload><NuxtLink to="/carica" class="shelter-area__link">{{ $t('nav.upload') }}</NuxtLink></template></i18n-t>
          <i18n-t keypath="area.step2" tag="li"><template #profile><NuxtLink :to="`/u/${user!.username}`" class="shelter-area__link">{{ $t('area.yourProfile') }}</NuxtLink></template><template #card><b>{{ $t('area.adoptionCard') }}</b></template></i18n-t>
          <li>{{ $t('area.step3') }}</li>
        </ol>
        <ShelterEditor v-if="editing" :shelter="shelter" @saved="onSaved" @cancel="editing = false" @images="refresh" />
        <button v-else type="button" class="btn btn--primary btn--lg" @click="startEdit">🎨 {{ $t('area.edit') }}</button>
        <p v-if="notice && !editing" class="shelter-area__notice" role="status">{{ notice }}</p>
      </div>

      <div id="richieste" class="shelter-area__req-head">
        <h2 class="shelter-area__name">{{ $t('area.requests') }} <span v-if="newCount" class="badge badge--action shelter-area__count">{{ $t('area.newCount', { n: newCount }) }}</span></h2>
        <div class="segmented" role="group" :aria-label="$t('area.whichRequests')">
          <button type="button" class="segmented__option" :aria-pressed="filter === 'open'" @click="filter = 'open'">{{ $t('area.open') }}</button>
          <button type="button" class="segmented__option" :aria-pressed="filter === 'closed'" @click="filter = 'closed'">{{ $t('area.closed') }}</button>
        </div>
      </div>
      <p v-if="!requests.length" class="u-muted shelter-area__empty">{{ filter === 'open' ? $t('area.noneOpen') : $t('area.noneClosed') }}</p>
      <article v-for="r in requests" :key="r.id" class="shelter-area__request" :class="`shelter-area__request--${r.status}`">
        <header class="shelter-area__request-head">
          <span class="badge">{{ $t(`area.status.${r.status}`) }}</span>
          <b>{{ $t('area.for') }} <NuxtLink :to="`/pet/${r.pet.id}`" class="shelter-area__link">{{ r.pet.name }}</NuxtLink></b>
          <small class="u-muted shelter-area__when">{{ when(r.createdAt) }}</small>
        </header>
        <p class="shelter-area__msg">{{ r.message }}</p>
        <p class="shelter-area__contact">
          @{{ r.requester }} · <a :href="`mailto:${r.email}?subject=${encodeURIComponent($t('area.mailSubject', { name: r.pet.name }))}`" class="shelter-area__link">{{ r.email }}</a>
          <template v-if="r.phone"> · <a :href="`tel:${r.phone.replace(/\s/g, '')}`" class="shelter-area__link">{{ r.phone }}</a></template>
        </p>
        <div class="shelter-area__buttons">
          <button v-if="r.status === 'new'" type="button" class="btn btn--ghost" @click="setStatus(r, 'contacted')">{{ $t('area.markContacted') }}</button>
          <button v-if="r.status !== 'closed'" type="button" class="btn btn--ghost" @click="setStatus(r, 'closed')">{{ $t('common.close') }}</button>
          <button v-else type="button" class="btn btn--ghost" @click="setStatus(r, 'contacted')">{{ $t('area.reopen') }}</button>
        </div>
      </article>

      <button type="button" class="btn btn--danger shelter-area__close" @click="close">{{ closing ? $t('area.confirmClose') : $t('area.closeShelter') }}</button>
    </template>

    <!-- In verifica -->
    <div v-else-if="shelter?.status === 'pending'" class="shelter-area__box">
      <span class="badge badge--wait">{{ $t('area.pending') }}</span>
      <h2 class="shelter-area__name">{{ shelter.name }}</h2>
      <i18n-t keypath="area.pendingText" tag="p"><template #email><b>{{ shelter.contactEmail }}</b></template></i18n-t>
      <p class="u-muted">{{ $t('area.pendingHint') }}</p>
      <button type="button" class="btn btn--danger shelter-area__close" @click="close">{{ closing ? $t('area.confirmWithdraw') : $t('area.withdraw') }}</button>
    </div>

    <!-- Prima richiesta o nuova richiesta dopo un rifiuto -->
    <template v-else>
      <p v-if="shelter?.status === 'rejected'" class="shelter-area__rejected" role="alert">
        <i18n-t keypath="area.rejected"><template #reason><b>{{ shelter.rejectReason }}</b></template></i18n-t>
      </p>
      <div class="shelter-area__box">
        <h2 class="shelter-area__name">{{ $t('area.applyTitle') }}</h2>
        <p class="u-muted">{{ $t('area.applyText') }}</p>
        <form class="shelter-area__form" novalidate @submit.prevent="apply">
          <div class="shelter-area__row">
            <div class="field"><label for="s-name" class="label">{{ $t('area.name') }}</label><input id="s-name" v-model="form.name" maxlength="60" placeholder="Rifugio Code Felici" class="input"></div>
            <div class="field"><label for="s-city" class="label">{{ $t('pet.city') }}</label><input id="s-city" v-model="form.city" maxlength="40" :placeholder="$t('upload.cityPlaceholder')" class="input"></div>
          </div>
          <label for="s-desc" class="label">{{ $t('area.description') }} <small>({{ $t('area.public') }})</small></label>
          <textarea id="s-desc" v-model="form.description" rows="4" maxlength="600" :placeholder="$t('area.descriptionPlaceholder')" class="input" />
          <label for="s-site" class="label">{{ $t('area.websiteSocial') }} <small>({{ $t('area.optionalPublic') }})</small></label>
          <input id="s-site" v-model="form.website" type="url" maxlength="200" placeholder="https://" class="input">
          <label for="s-tax" class="label">{{ $t('area.taxCode') }}</label>
          <input id="s-tax" v-model="form.taxCode" maxlength="16" autocapitalize="characters" placeholder="97123450012" class="input">
          <div class="shelter-area__row">
            <div class="field"><label for="s-mail" class="label">{{ $t('area.email') }}</label><input id="s-mail" v-model="form.contactEmail" type="email" maxlength="254" placeholder="info@rifugio.it" class="input"></div>
            <div class="field"><label for="s-phone" class="label">{{ $t('adoption.phone') }} <small>({{ $t('common.optional') }})</small></label><input id="s-phone" v-model="form.phone" type="tel" maxlength="30" class="input"></div>
          </div>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <button type="submit" class="btn btn--primary btn--lg shelter-area__submit" :disabled="sending">{{ sending ? $t('common.sending') : $t('area.submit') }}</button>
        </form>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: area del rifugio (richiesta di verifica, personalizzazione, richieste di adozione)
.shelter-area {
  @include stack($space-6);
  padding-bottom: 12px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;

  &__title { font-size: 26px; }

  &__name { font-size: 21px; }

  &__box {
    @include card(18px, 24px);
    @include stack($space-4);
    align-items: flex-start;

    p { margin: 0; line-height: 1.5; max-width: 65ch; }
  }

  &__head { display: flex; gap: $space-5; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; width: 100%; }

  &__steps { margin: 0; padding-left: 20px; @include stack($space-1); line-height: 1.45; }

  &__link { color: var(--coral-deep); font-weight: 800; }

  &__form { @include stack($space-2); width: 100%; }

  &__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: $space-4; }

  &__submit { align-self: flex-start; margin-top: $space-2; }

  &__notice { color: var(--ink); font-weight: 700; }

  &__rejected { margin: 0; padding: 12px 14px; border-radius: 16px; background: var(--coral-soft); color: var(--ink); }

  &__req-head { scroll-margin-top: 80px; display: flex; align-items: center; justify-content: space-between; gap: $space-4; flex-wrap: wrap; margin-top: $space-2; }

  &__count { font-family: var(--body); font-size: 13px; vertical-align: middle; }

  &__empty { margin: 0; text-align: center; padding: 16px 0; }

  &__request {
    @include card(16px, 22px);
    @include stack($space-3);
    border-left: 5px solid var(--line);

    &--new { border-left-color: var(--coral); }
  }

  &__request-head { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; }

  &__when { margin-left: auto; }

  &__msg { margin: 0; white-space: pre-line; line-height: 1.5; max-width: 65ch; overflow-wrap: anywhere; }

  &__contact { margin: 0; font-weight: 700; font-size: 14px; overflow-wrap: anywhere; }

  &__buttons { @include cluster($space-3); justify-content: flex-end; width: 100%; }

  &__close { align-self: flex-start; margin-top: $space-3; }
}
</style>
