<script setup lang="ts">
import { emailSchema } from '#shared/models'

// Chiede il link per scegliere una password nuova. La risposta è la stessa che l'email esista o no
const { t, locale } = useI18n()
useHead({ title: () => t('auth.forgotTitle') })

const email = ref('')
const sent = ref(false)
const sending = ref(false)
const error = ref('')

async function submit() {
  const check = emailSchema.safeParse(email.value)
  if (!check.success) {
    error.value = t('validation.email')
    return
  }
  sending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot', { method: 'POST', body: { email: check.data, locale: locale.value } })
    sent.value = true
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
      <h1 class="auth-page__title">{{ $t('auth.forgotTitle') }}</h1>
      <p v-if="sent" class="auth-page__lead" role="status">📬 {{ $t('auth.forgotSent') }}</p>
      <template v-else>
        <p class="auth-page__lead">{{ $t('auth.forgotLead') }}</p>
        <label for="email" class="label auth-page__label">{{ $t('auth.email') }}</label>
        <input id="email" v-model="email" type="email" autocomplete="email" inputmode="email" required class="input auth-page__input">
        <p v-if="error" class="error auth-page__error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--lg auth-page__submit" :disabled="sending">
          {{ sending ? $t('auth.wait') : $t('auth.forgotSend') }}
        </button>
      </template>
      <p class="auth-page__switch"><NuxtLink to="/login">{{ $t('auth.backToLogin') }}</NuxtLink></p>
    </form>
  </section>
</template>
