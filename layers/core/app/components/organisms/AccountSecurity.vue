<script setup lang="ts">
/**
 * Organismo: sicurezza dell'account nella pagina /account. Cambio password (con quella attuale)
 * e "Esci da tutti gli altri dispositivi". In tutti e due i casi le altre sessioni smettono di valere
 */
const { fetch: refreshSession } = useUserSession()

const changing = ref(false)
const current = ref('')
const next = ref('')
const busy = ref(false)
const error = ref('')
const done = ref('')

function reset() {
  changing.value = false
  current.value = ''
  next.value = ''
  error.value = ''
}

async function changePassword() {
  error.value = ''
  done.value = ''
  busy.value = true
  try {
    await $fetch('/api/me/password', { method: 'POST', body: { current: current.value, password: next.value } })
    await refreshSession()
    reset()
    done.value = 'account.passwordChanged'
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}

async function signOutOthers() {
  error.value = ''
  done.value = ''
  busy.value = true
  try {
    await $fetch('/api/me/sessions', { method: 'DELETE' })
    await refreshSession()
    done.value = 'account.signedOutOthers'
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="account-security">
    <p class="account-security__text">{{ $t('account.securityText') }}</p>

    <form v-if="changing" class="account-security__form" @submit.prevent="changePassword">
      <div class="field">
        <label for="pw-current" class="label">{{ $t('account.currentPassword') }}</label>
        <input id="pw-current" v-model="current" type="password" autocomplete="current-password" required class="input">
      </div>
      <div class="field">
        <label for="pw-next" class="label">{{ $t('account.newPassword') }}</label>
        <input id="pw-next" v-model="next" type="password" autocomplete="new-password" minlength="10" maxlength="128" required class="input">
        <p class="hint">{{ $t('account.newPasswordHint') }}</p>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="account-security__buttons">
        <button type="button" class="btn btn--ghost" @click="reset">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary" :disabled="!current || next.length < 10 || busy">
          {{ busy ? $t('auth.wait') : $t('account.changePassword') }}
        </button>
      </div>
    </form>

    <template v-else>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="account-security__buttons">
        <button type="button" class="btn btn--ghost" @click="changing = true; done = ''">{{ $t('account.changePassword') }}</button>
        <button type="button" class="btn btn--ghost" :disabled="busy" @click="signOutOthers">{{ $t('account.signOutOthers') }}</button>
      </div>
    </template>

    <p v-if="done" class="account-security__done" role="status">✓ {{ $t(done) }}</p>
  </div>
</template>

<style lang="scss" scoped>
.account-security {
  @include stack($space-4);

  &__text { margin: 0; line-height: 1.5; }

  &__form { @include stack($space-3); }

  &__buttons { @include cluster($space-3); }

  &__done { margin: 0; font-weight: 800; color: color-mix(in srgb, var(--mint) 70%, var(--ink)); }
}
</style>
