<script setup lang="ts">
/**
 * Organismo: verifica in due passaggi nella pagina /account. Si attiva con la password, inquadrando il QR
 * con un'app di autenticazione e scrivendo il primo codice; poi si mostrano una volta i codici di emergenza.
 * Obbligatoria per gli admin
 */
const { fetch: refreshSession } = useUserSession()
const { data: status, refresh } = await useFetch<{ enabled: boolean, recoveryLeft: number, required: boolean }>('/api/me/totp', { key: 'me-totp' })

type Step = 'idle' | 'password' | 'scan' | 'codes' | 'disable' | 'renew'
const step = ref<Step>('idle')
const password = ref('')
const code = ref('')
const setup = ref<{ secret: string, uri: string, qr: string } | null>(null)
const codes = ref<string[]>([])
const busy = ref(false)
const error = ref('')
const done = ref('')

// Segreto a gruppi di 4 lettere, più facile da ricopiare a mano
const secretGroups = computed(() => setup.value?.secret.match(/.{1,4}/g)?.join(' ') ?? '')

function go(next: Step) {
  step.value = next
  password.value = ''
  code.value = ''
  error.value = ''
  done.value = ''
}

async function run(action: () => Promise<void>) {
  error.value = ''
  busy.value = true
  try {
    await action()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}

const start = () => run(async () => {
  setup.value = await $fetch<{ secret: string, uri: string, qr: string }>('/api/me/totp/setup', { method: 'POST', body: { password: password.value } })
  go('scan')
})

const enable = () => run(async () => {
  const res = await $fetch<{ recoveryCodes: string[] }>('/api/me/totp/enable', { method: 'POST', body: { code: code.value } })
  codes.value = res.recoveryCodes
  setup.value = null
  await Promise.all([refresh(), refreshSession()])
  go('codes')
})

const disable = () => run(async () => {
  await $fetch('/api/me/totp/disable', { method: 'POST', body: { password: password.value, code: code.value } })
  await Promise.all([refresh(), refreshSession()])
  go('idle')
  done.value = 'totp.disabled'
})

const renew = () => run(async () => {
  const res = await $fetch<{ recoveryCodes: string[] }>('/api/me/totp/recovery', { method: 'POST', body: { code: code.value } })
  codes.value = res.recoveryCodes
  await refresh()
  go('codes')
})

const copied = ref(false)
async function copyCodes() {
  await navigator.clipboard?.writeText(codes.value.join('\n'))
  copied.value = true
}

function finishCodes() {
  codes.value = []
  copied.value = false
  go('idle')
  done.value = 'totp.enabledDone'
}
</script>

<template>
  <div class="two-factor">
    <p v-if="status?.required && !status.enabled" class="two-factor__required" role="note">{{ $t('totp.requiredAdmin') }}</p>

    <!-- Codici di emergenza: si vedono solo adesso -->
    <template v-if="step === 'codes'">
      <p class="two-factor__text"><b>{{ $t('totp.codesTitle') }}</b> {{ $t('totp.codesText') }}</p>
      <ul class="two-factor__codes" :aria-label="$t('totp.codesTitle')">
        <li v-for="c in codes" :key="c"><code>{{ c }}</code></li>
      </ul>
      <div class="two-factor__buttons">
        <button type="button" class="btn btn--ghost" @click="copyCodes">{{ copied ? `✓ ${$t('totp.copied')}` : $t('totp.copy') }}</button>
        <button type="button" class="btn btn--primary" @click="finishCodes">{{ $t('totp.codesSaved') }}</button>
      </div>
    </template>

    <!-- Attivazione, passo 1: password -->
    <form v-else-if="step === 'password'" class="two-factor__form" @submit.prevent="start">
      <p class="two-factor__text">{{ $t('totp.passwordLead') }}</p>
      <div class="field">
        <label for="totp-password" class="label">{{ $t('account.currentPassword') }}</label>
        <input id="totp-password" v-model="password" type="password" autocomplete="current-password" required class="input">
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="two-factor__buttons">
        <button type="button" class="btn btn--ghost" @click="go('idle')">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary" :disabled="!password || busy">{{ busy ? $t('auth.wait') : $t('totp.next') }}</button>
      </div>
    </form>

    <!-- Attivazione, passo 2: QR e primo codice -->
    <form v-else-if="step === 'scan' && setup" class="two-factor__form" @submit.prevent="enable">
      <p class="two-factor__text">{{ $t('totp.scanLead') }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -- SVG generato dal nostro server (uqr), senza testo esterno -->
      <div class="two-factor__qr" role="img" :aria-label="$t('totp.qrLabel')" v-html="setup.qr" />
      <p class="two-factor__text">
        {{ $t('totp.manual') }}<br>
        <code class="two-factor__secret">{{ secretGroups }}</code>
      </p>
      <a :href="setup.uri" class="two-factor__link">{{ $t('totp.openApp') }}</a>
      <div class="field">
        <label for="totp-code" class="label">{{ $t('totp.codeLabel') }}</label>
        <input
          id="totp-code" v-model="code" class="input two-factor__code" required
          inputmode="numeric" autocomplete="one-time-code" maxlength="7" pattern="\d{3} ?\d{3}"
        >
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="two-factor__buttons">
        <button type="button" class="btn btn--ghost" @click="go('idle')">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary" :disabled="code.replace(/\s/g, '').length !== 6 || busy">{{ busy ? $t('auth.wait') : $t('totp.enable') }}</button>
      </div>
    </form>

    <!-- Spegnere, o nuovi codici di emergenza -->
    <form v-else-if="step === 'disable' || step === 'renew'" class="two-factor__form" @submit.prevent="step === 'disable' ? disable() : renew()">
      <p class="two-factor__text">{{ step === 'disable' ? $t('totp.disableLead') : $t('totp.renewLead') }}</p>
      <div v-if="step === 'disable'" class="field">
        <label for="totp-off-password" class="label">{{ $t('account.currentPassword') }}</label>
        <input id="totp-off-password" v-model="password" type="password" autocomplete="current-password" required class="input">
      </div>
      <div class="field">
        <label for="totp-off-code" class="label">{{ $t('totp.codeOrRecovery') }}</label>
        <input id="totp-off-code" v-model="code" class="input two-factor__code" required autocomplete="one-time-code" maxlength="12">
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="two-factor__buttons">
        <button type="button" class="btn btn--ghost" @click="go('idle')">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary" :disabled="!code || (step === 'disable' && !password) || busy">
          {{ busy ? $t('auth.wait') : step === 'disable' ? $t('totp.disable') : $t('totp.renew') }}
        </button>
      </div>
    </form>

    <template v-else>
      <p class="two-factor__text">{{ status?.enabled ? $t('totp.onText', { n: status.recoveryLeft }) : $t('totp.offText') }}</p>
      <div class="two-factor__buttons">
        <template v-if="status?.enabled">
          <button type="button" class="btn btn--ghost" @click="go('renew')">{{ $t('totp.renew') }}</button>
          <button type="button" class="btn btn--ghost" @click="go('disable')">{{ $t('totp.disable') }}</button>
        </template>
        <button v-else type="button" class="btn btn--primary" @click="go('password')">{{ $t('totp.enable') }}</button>
      </div>
    </template>

    <p v-if="done" class="two-factor__done" role="status">✓ {{ $t(done) }}</p>
  </div>
</template>

<style lang="scss" scoped>
.two-factor {
  @include stack($space-4);

  &__text { margin: 0; line-height: 1.5; }

  &__required {
    margin: 0;
    padding: 12px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--action) 12%, var(--surface));
    font-weight: 700;
    line-height: 1.4;
  }

  &__form { @include stack($space-3); }

  &__buttons { @include cluster($space-3); }

  // QR su fondo bianco anche nel tema scuro: le app lo leggono meglio
  &__qr {
    width: 200px;
    padding: 8px;
    border-radius: 12px;
    background: #fff;

    :deep(svg) { display: block; width: 100%; height: auto; }
  }

  &__secret { font-size: 15px; letter-spacing: 0.04em; word-break: break-all; }

  &__link { font-weight: 700; color: var(--ink); }

  &__code { max-width: 12ch; font-variant-numeric: tabular-nums; letter-spacing: 0.1em; }

  &__codes {
    display: grid;
    grid-template-columns: repeat(2, max-content);
    gap: 6px 24px;
    margin: 0;
    padding: 12px 16px;
    list-style: none;
    border-radius: 12px;
    background: var(--bg);

    code { font-size: 16px; }
  }

  &__done { margin: 0; font-weight: 800; color: color-mix(in srgb, var(--mint) 70%, var(--ink)); }
}
</style>
