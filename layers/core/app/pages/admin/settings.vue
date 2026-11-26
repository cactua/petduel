<script setup lang="ts">
import { SITE_SETTINGS_DEFAULT, siteSettingsSchema, type SiteSettings } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Impostazioni · Admin' })
const { t } = useI18n()

// Impostazioni generali del sito: ogni sito ha le sue. Ogni salvataggio finisce nel Registro con il prima e il dopo
const { data, refresh } = await useFetch<SiteSettings>('/api/admin/settings', { default: () => ({ ...SITE_SETTINGS_DEFAULT }) })

// Vuoto = nessun limite. Vue trasforma in numero quello che si scrive in un campo numerico, il campo vuoto resta ''
type Form = Omit<SiteSettings, 'maxPetsPerUser' | 'maxPhotosPerPet'> & { maxPetsPerUser: string | number, maxPhotosPerPet: string | number }
const toForm = (s: SiteSettings): Form => ({ ...s, maxPetsPerUser: s.maxPetsPerUser?.toString() ?? '', maxPhotosPerPet: s.maxPhotosPerPet?.toString() ?? '' })
const form = reactive<Form>(toForm(data.value))
watch(data, v => Object.assign(form, toForm(v)))

const optional = (v: string | number) => (String(v).trim() === '' ? null : Number(v))
const value = computed(() => ({ ...form, maxPetsPerUser: optional(form.maxPetsPerUser), maxPhotosPerPet: optional(form.maxPhotosPerPet) }))
const dirty = computed(() => JSON.stringify(value.value) !== JSON.stringify({ ...data.value }))

const error = ref('')
const notice = ref('')
const saving = ref(false)
async function save() {
  error.value = ''
  notice.value = ''
  const check = siteSettingsSchema.safeParse(value.value)
  if (!check.success) {
    error.value = check.error.issues[0]?.message === 'Il limite minimo è 1' ? 'I limiti partono da 1: lascia vuoto per nessun limite' : 'Controlla i numeri: devono essere interi'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/settings', { method: 'PUT', body: check.data })
    notice.value = 'Impostazioni salvate. Valgono da subito.'
    await refresh()
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
  <section class="admin-page site-settings">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Impostazioni</h1>
    </header>
    <p class="admin-page__lead">Regole generali di questo sito. Valgono da subito; ogni modifica finisce nel Registro, con il valore di prima e quello nuovo.</p>

    <form class="site-settings__form" novalidate @submit.prevent="save">
      <fieldset class="site-settings__group">
        <legend class="site-settings__legend">📤 Caricamenti</legend>
        <p class="site-settings__help">
          Lascia vuoto per nessun limite. Chi ha già superato un limite tiene quello che ha, ma non può aggiungere altro.
          Gli admin e i rifugi approvati non hanno limiti. Chi carica vede il limite prima di provare.
        </p>
        <div class="site-settings__row">
          <label for="s-pets" class="site-settings__label">
            <b>Quanti {{ t('limits.noun') }} per utente</b>
            <small>Vuoto: quanti ne vuole</small>
          </label>
          <input id="s-pets" v-model="form.maxPetsPerUser" type="number" min="1" inputmode="numeric" placeholder="Nessun limite" class="input site-settings__number">
        </div>
        <div class="site-settings__row">
          <label for="s-photos" class="site-settings__label">
            <b>Quante immagini per {{ t('limits.nounOne') }}</b>
            <small>Contano quelle in attesa e approvate, non le rifiutate</small>
          </label>
          <input id="s-photos" v-model="form.maxPhotosPerPet" type="number" min="1" inputmode="numeric" placeholder="Nessun limite" class="input site-settings__number">
        </div>
        <div class="site-settings__row">
          <label for="s-pending" class="site-settings__label">
            <b>Immagini in attesa per utente</b>
            <small>Oltre, si aspetta la moderazione prima di caricarne altre</small>
          </label>
          <input id="s-pending" v-model.number="form.maxPendingPerUser" type="number" min="1" max="500" inputmode="numeric" class="input site-settings__number">
        </div>
        <label class="site-settings__switch">
          <input v-model="form.uploadsOpen" type="checkbox" role="switch" class="site-settings__check">
          <span class="site-settings__label">
            <b>Caricamenti aperti</b>
            <small>Spegni per fermare i caricamenti per un po', ad esempio se la moderazione è indietro</small>
          </span>
        </label>
      </fieldset>

      <fieldset class="site-settings__group">
        <legend class="site-settings__legend">👋 Iscrizioni</legend>
        <label class="site-settings__switch">
          <input v-model="form.signupsOpen" type="checkbox" role="switch" class="site-settings__check">
          <span class="site-settings__label">
            <b>Iscrizioni aperte</b>
            <small>Spente, chi ha già un account entra lo stesso; i nuovi vedono un avviso</small>
          </span>
        </label>
        <div class="site-settings__row">
          <label for="s-signups" class="site-settings__label">
            <b>Iscrizioni al giorno dalla stessa rete</b>
            <small>Una famiglia o un ufficio ci stanno, una fabbrica di account no</small>
          </label>
          <input id="s-signups" v-model.number="form.maxSignupsPerNetwork" type="number" min="1" max="1000" inputmode="numeric" class="input site-settings__number">
        </div>
      </fieldset>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="notice" class="admin-page__notice" role="status">{{ notice }}</p>
      <div class="site-settings__actions">
        <button type="submit" class="btn btn--primary btn--lg" :disabled="saving || !dirty">{{ saving ? 'Salvataggio…' : 'Salva le impostazioni' }}</button>
        <button v-if="dirty" type="button" class="btn btn--ghost btn--lg" @click="Object.assign(form, toForm(data))">Annulla</button>
      </div>
    </form>

  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: impostazioni generali del sito
.site-settings {
  &__form { @include stack($space-5); max-width: 680px; }

  &__group { @include card(18px, $radius-lg); @include stack($space-4); margin: 0; border: 0; }

  &__legend { float: left; width: 100%; padding: 0; font-family: var(--display); font-size: 20px; font-weight: 700; }

  &__help { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-2 $space-4;
    padding-top: $space-3;
    border-top: 1px solid var(--line);
  }

  &__label {
    @include stack(2px);
    flex: 1 1 240px;
    min-width: 0;

    b { font-size: 15px; }

    small { color: var(--muted); font-size: 13px; font-weight: 600; }
  }

  &__number { width: 140px; font-variant-numeric: tabular-nums; }

  &__switch {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    padding-top: $space-3;
    border-top: 1px solid var(--line);
    cursor: pointer;
  }

  &__check { width: 22px; height: 22px; margin: 2px 0 0; flex-shrink: 0; accent-color: var(--coral); }

  &__actions { @include cluster($space-3); }
}
</style>
