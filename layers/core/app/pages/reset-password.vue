<script setup lang="ts">
import { passwordSchema } from '#shared/models'

// Password nuova dal link ricevuto per email. Salvandola si entra, e gli altri dispositivi vengono disconnessi
const { t } = useI18n()
useHead({ title: () => t('auth.resetTitle'), meta: [{ name: 'referrer', content: 'no-referrer' }] })
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')

const { data } = await useFetch('/api/auth/reset', { query: { token }, server: false, default: () => null })
const password = ref('')
const sending = ref(false)
const error = ref('')

async function submit() {
  const check = passwordSchema.safeParse(password.value)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset', { method: 'POST', body: { token: token.value, password: check.data } })
    await refreshSession()
    await navigateTo('/')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <form class="auth-page__form" novalidate @submit.prevent="submit">
      <SiteMascot class="auth-page__mascot" />
      <h1 class="auth-page__title">{{ $t('auth.resetTitle') }}</h1>
      <p v-if="data === null" class="auth-page__lead">{{ $t('auth.wait') }}</p>
      <template v-else-if="!data.valid">
        <p class="auth-page__lead" role="alert">{{ $t('auth.resetInvalid') }}</p>
        <NuxtLink to="/forgot-password" class="btn btn--primary btn--lg auth-page__submit">{{ $t('auth.resetRequestNew') }}</NuxtLink>
      </template>
      <template v-else>
        <p class="auth-page__lead">{{ $t('auth.resetLead') }}</p>
        <label for="password" class="label auth-page__label">{{ $t('account.newPassword') }}</label>
        <input id="password" v-model="password" type="password" autocomplete="new-password" required class="input auth-page__input">
        <small class="auth-page__help">{{ $t('auth.passwordHelp') }}</small>
        <p v-if="error" class="error auth-page__error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg auth-page__submit" :disabled="sending">
          {{ sending ? $t('auth.wait') : $t('auth.resetSave') }}
        </button>
      </template>
    </form>
  </section>
</template>
