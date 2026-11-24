<script setup lang="ts">
// Organismo: promemoria per confermare l'email, in cima alle pagine finché non la si conferma.
// Si può nascondere per questa visita; il link si può farsi rimandare
const { user } = useUserSession()
const { locale } = useI18n()
const hidden = useState('email-verify-hidden', () => false)
const show = computed(() => user.value?.emailVerified === false && !hidden.value)
const sending = ref(false)
const message = ref('')

async function resend() {
  sending.value = true
  message.value = ''
  try {
    await $fetch('/api/me/verify-email', { method: 'POST', body: { locale: locale.value } })
    message.value = tr('auth.verifySent')
  }
  catch (e) {
    message.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <aside v-if="show" class="email-verify" :aria-label="$t('auth.verifyTitle')">
    <p class="email-verify__text">✉️ {{ $t('auth.verifyBar') }}</p>
    <p v-if="message" class="email-verify__text email-verify__text--status" role="status">{{ message }}</p>
    <div class="email-verify__actions">
      <button type="button" class="btn btn--sm btn--primary" :disabled="sending" @click="resend">{{ $t('auth.verifyResend') }}</button>
      <button type="button" class="btn btn--sm" @click="hidden = true">{{ $t('auth.verifyHide') }}</button>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.email-verify {
  @include card(14px, 18px);
  @include stack($space-2);
  margin-bottom: $space-4;

  &__text { margin: 0; font-size: 14px; line-height: 1.45; }

  &__text--status { font-weight: 700; }

  &__actions { @include cluster($space-2); }
}
</style>
