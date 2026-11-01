<script setup lang="ts">
// Il proprio account: scaricare i dati ed eliminare tutto (diritti di accesso e cancellazione)
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => `${t('account.title')}` })

const { user, clear } = useUserSession()
const { open: openConsent } = useConsent()

const confirming = ref(false)
const password = ref('')
const understood = ref(false)
const deleting = ref(false)
const error = ref('')

async function remove() {
  error.value = ''
  deleting.value = true
  try {
    await $fetch('/api/me', { method: 'DELETE', body: { password: password.value } })
    await clear()
    await navigateTo('/')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="account-page">
    <header class="account-page__header">
      <h1 class="account-page__title">{{ $t('account.title') }}</h1>
      <p class="account-page__user">@{{ user?.username }}</p>
    </header>

    <article class="account-page__card">
      <h2 class="account-page__card-title">📦 {{ $t('account.exportTitle') }}</h2>
      <p class="account-page__text">{{ $t('account.exportText') }}</p>
      <!-- Link normale: il server risponde con un file da salvare -->
      <a href="/api/me/export" class="btn btn--ghost account-page__action" download>{{ $t('account.exportButton') }}</a>
    </article>

    <article class="account-page__card">
      <h2 class="account-page__card-title">🍪 {{ $t('consent.title') }}</h2>
      <p class="account-page__text">{{ $t('account.consentText') }}</p>
      <button type="button" class="btn btn--ghost account-page__action" @click="openConsent">{{ $t('account.consentButton') }}</button>
    </article>

    <article class="account-page__card account-page__card--danger">
      <h2 class="account-page__card-title">{{ $t('account.deleteTitle') }}</h2>
      <p class="account-page__text">{{ $t('account.deleteText') }}</p>
      <button v-if="!confirming" type="button" class="account-page__delete account-page__action" @click="confirming = true">{{ $t('account.deleteButton') }}</button>
      <form v-else class="account-page__confirm" @submit.prevent="remove">
        <label for="del-pass" class="label">{{ $t('account.passwordLabel') }}</label>
        <input id="del-pass" v-model="password" type="password" autocomplete="current-password" required class="input">
        <label class="account-page__check"><input v-model="understood" type="checkbox" class="account-page__checkbox"> {{ $t('account.understood') }}</label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="account-page__buttons">
          <button type="button" class="btn btn--ghost" @click="confirming = false; password = ''; understood = false; error = ''">{{ $t('common.cancel') }}</button>
          <button type="submit" class="account-page__delete" :disabled="!password || !understood || deleting">
            {{ deleting ? $t('auth.wait') : $t('account.deleteConfirm') }}
          </button>
        </div>
      </form>
    </article>

    <p class="account-page__links">
      <NuxtLink to="/privacy" class="account-page__link">{{ $t('legal.privacy') }}</NuxtLink> ·
      <NuxtLink to="/cookie" class="account-page__link">{{ $t('legal.cookie') }}</NuxtLink> ·
      <NuxtLink to="/termini" class="account-page__link">{{ $t('legal.terms') }}</NuxtLink>
    </p>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: impostazioni dell'account (dati, consenso, eliminazione)
.account-page {
  max-width: 620px;
  width: 100%;
  margin: 0 auto;
  @include stack($space-6);

  &__title { margin: 0; font-family: var(--display); font-size: clamp(26px, 5vw, 34px); }

  &__user { margin: 2px 0 0; color: var(--muted); font-weight: 800; }

  &__card {
    @include card(18px 20px, 24px);
    @include stack($space-4);
    width: 100%;

    &--danger { box-shadow: 0 0 0 2px color-mix(in srgb, var(--coral) 40%, transparent), $shadow-card; }
  }

  &__card-title {
    margin: 0;
    font-family: var(--display);
    font-size: 20px;

    .account-page__card--danger & { color: var(--coral-deep); }
  }

  &__text { margin: 0; line-height: 1.5; }

  &__action { align-self: flex-start; }

  &__delete {
    border: 0;
    @include pill(11px, 18px);
    font-weight: 900;
    font-size: 15px;
    cursor: pointer;
    background: var(--coral-deep);
    color: #fff;

    &:disabled { opacity: .5; cursor: not-allowed; }
  }

  &__confirm { @include stack($space-3); }

  &__check { display: flex; gap: $space-3; align-items: flex-start; font-weight: 700; font-size: 14px; line-height: 1.4; }

  &__checkbox { margin-top: 3px; }

  &__buttons { @include cluster($space-3); }

  &__links { text-align: center; color: var(--muted); font-size: 13px; }

  &__link { color: var(--muted); font-weight: 800; }
}
</style>
