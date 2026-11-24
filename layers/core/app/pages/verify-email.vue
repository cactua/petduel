<script setup lang="ts">
// Conferma dell'email dal link ricevuto. Il codice si manda con un POST: le anteprime dei link nelle app
// di posta aprono la pagina ma non eseguono il codice, quindi non lo consumano per sbaglio
const { t } = useI18n()
useHead({ title: () => t('auth.verifyTitle'), meta: [{ name: 'referrer', content: 'no-referrer' }] })
const route = useRoute()
const { loggedIn, fetch: refreshSession } = useUserSession()
const state = ref<'working' | 'done' | 'failed'>('working')
const error = ref('')

onMounted(async () => {
  try {
    await $fetch('/api/auth/verify', { method: 'POST', body: { token: typeof route.query.token === 'string' ? route.query.token : '' } })
    state.value = 'done'
    if (loggedIn.value) await refreshSession()
  }
  catch (e) {
    error.value = errorMessage(e)
    state.value = 'failed'
  }
})
</script>

<template>
  <section class="auth-page">
    <div class="auth-page__form">
      <SiteMascot class="auth-page__mascot" />
      <h1 class="auth-page__title">{{ $t('auth.verifyTitle') }}</h1>
      <p v-if="state === 'working'" class="auth-page__lead" role="status">{{ $t('auth.verifyWorking') }}</p>
      <p v-else-if="state === 'done'" class="auth-page__lead" role="status">{{ $t('auth.verifyDone') }}</p>
      <p v-else class="error auth-page__error" role="alert">{{ error }}</p>
      <NuxtLink v-if="state !== 'working'" to="/" class="btn btn--primary btn--lg auth-page__submit">{{ $t('auth.verifyGoHome') }}</NuxtLink>
    </div>
  </section>
</template>
