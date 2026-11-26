<script setup lang="ts">
import { loginSchema, signupSchema } from '#shared/models'

const props = defineProps<{ mode: 'login' | 'register' }>()

const route = useRoute()
const { locale } = useI18n()
const { fetch: refreshSession } = useUserSession()
const form = reactive({ email: '', username: '', password: '', rules: false, age: false, code: '' })
// Password giusta e verifica in due passaggi attiva: si chiede il codice dell'app
const askCode = ref(false)
const codeInput = ref<HTMLInputElement>()
const error = ref('')
const sending = ref(false)
const isRegister = computed(() => props.mode === 'register')
// Iscrizioni chiuse dall'admin (Impostazioni): lo si dice prima che si compili il modulo
const limits = useSiteLimits()
const closed = computed(() => isRegister.value && limits.signupsClosed.value)

async function submit() {
  // Stesse regole del server, così l'errore arriva subito
  const check = (isRegister.value ? signupSchema : loginSchema).safeParse(form)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ totp?: boolean }>(isRegister.value ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: { ...check.data, locale: locale.value } })
    if (res?.totp) {
      askCode.value = true
      await nextTick()
      codeInput.value?.focus()
      return
    }
    await refreshSession()
    await navigateTo(safeRedirect(route.query.redirect))
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
  <section class="auth-form">
    <form class="auth-form__form" novalidate @submit.prevent="submit">
      <SiteMascot class="auth-form__mascot" />
      <h1 class="auth-form__title">{{ isRegister ? $t('auth.registerTitle') : $t('auth.loginTitle') }}</h1>
      <p class="auth-form__lead">
        {{ isRegister ? $t('auth.registerLead') : $t('auth.loginLead') }}
      </p>
      <p v-if="closed" class="auth-form__closed" role="status">{{ $t('limits.signupsClosed') }}</p>

      <label for="email" class="label auth-form__label">{{ $t('auth.email') }}</label>
      <input id="email" v-model="form.email" type="email" autocomplete="email" inputmode="email" required class="input auth-form__input">

      <template v-if="isRegister">
        <label for="username" class="label auth-form__label">{{ $t('auth.username') }}</label>
        <input id="username" v-model="form.username" autocomplete="username" autocapitalize="none" required :placeholder="$t('auth.usernamePlaceholder')" class="input auth-form__input">
        <small class="auth-form__help">{{ $t('auth.usernameHelp') }}</small>
      </template>

      <label for="password" class="label auth-form__label">{{ $t('auth.password') }}</label>
      <input
        id="password" v-model="form.password" type="password" required class="input auth-form__input"
        :autocomplete="isRegister ? 'new-password' : 'current-password'"
      >
      <small v-if="isRegister" class="auth-form__help">{{ $t('auth.passwordHelp') }}</small>
      <NuxtLink v-else to="/forgot-password" class="auth-form__forgot">{{ $t('auth.forgotLink') }}</NuxtLink>

      <template v-if="askCode">
        <label for="totp-code" class="label auth-form__label">{{ $t('auth.totpCode') }}</label>
        <input
          id="totp-code" ref="codeInput" v-model="form.code" class="input auth-form__input"
          autocomplete="one-time-code" maxlength="12" required
        >
        <small class="auth-form__help">{{ $t('auth.totpHelp') }}</small>
      </template>

      <label v-if="isRegister" class="auth-form__rules">
        <input v-model="form.rules" type="checkbox" class="auth-form__rules-check">
        <i18n-t keypath="auth.rulesAccept" tag="span" scope="global">
          <template #rules><NuxtLink to="/rules" target="_blank">{{ $t('rules.link') }}</NuxtLink></template>
        </i18n-t>
      </label>
      <label v-if="isRegister" class="auth-form__rules">
        <input v-model="form.age" type="checkbox" class="auth-form__rules-check">
        <span>{{ $t('auth.ageConfirm') }}</span>
      </label>
      <p v-if="error" class="error auth-form__error" role="alert">{{ error }}</p>
      <i18n-t v-if="isRegister" keypath="auth.legal" tag="p" class="auth-form__legal" scope="global">
        <template #terms><NuxtLink to="/terms" target="_blank">{{ $t('legal.terms') }}</NuxtLink></template>
        <template #privacy><NuxtLink to="/privacy" target="_blank">{{ $t('legal.privacy') }}</NuxtLink></template>
      </i18n-t>
      <button type="submit" class="btn btn--primary btn--lg auth-form__submit" :disabled="sending || closed">
        {{ sending ? $t('auth.wait') : isRegister ? $t('auth.register') : $t('nav.login') }}
      </button>

      <p class="auth-form__switch">
        <template v-if="isRegister">
          {{ $t('auth.haveAccount') }} <NuxtLink :to="{ path: '/login', query: route.query }">{{ $t('nav.login') }}</NuxtLink>
        </template>
        <template v-else>
          {{ $t('auth.noAccount') }} <NuxtLink :to="{ path: '/signup', query: route.query }">{{ $t('auth.register') }}</NuxtLink>
        </template>
      </p>
    </form>
  </section>
</template>

<style lang="scss" scoped>
// Organismo: accesso e registrazione
.auth-form {
  display: flex;
  align-items: flex-start;
  justify-content: center;

  &__form { width: 100%; max-width: 400px; @include stack($space-2); padding-block: 12px; }

  &__mascot { width: 76px; height: 69px; margin-bottom: 4px; }

  &__title { font-size: 26px; }

  &__lead { color: var(--muted); margin: 0 0 10px; }

  &__label { margin-top: $space-2; }

  &__input { padding: 12px 14px; background: var(--surface); }

  &__help { color: var(--muted); font-size: 12px; }

  &__forgot { align-self: flex-end; color: var(--coral-deep); font-size: 14px; font-weight: 700; }

  &__error { color: var(--coral); margin-top: $space-2; }

  &__closed {
    margin: $space-2 0 0;
    padding: 10px 14px;
    border-radius: $radius-md;
    background: color-mix(in srgb, var(--sun) 18%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--sun-deep) 45%, var(--line));
    font-weight: 700;
    font-size: 14px;
  }

  &__legal {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;

    a { color: var(--coral-deep); font-weight: 800; }
  }

  &__submit { margin-top: 12px; padding: 14px; }

  &__switch {
    text-align: center;
    color: var(--muted);

    a { color: var(--coral); font-weight: 700; }
  }

  &__rules { display: flex; gap: $space-3; align-items: flex-start; font-size: 14px; font-weight: 700; line-height: 1.4; }

  &__rules-check { margin-top: 3px; accent-color: var(--action); }
}
</style>
