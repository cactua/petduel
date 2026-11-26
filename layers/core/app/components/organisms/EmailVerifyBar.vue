<script setup lang="ts">
// Organismo: promemoria per confermare l'email, in cima alle pagine finché non la si conferma.
// Si può nascondere per questa visita; il link si può farsi rimandare, e com'è andata lo dice una modale
const { user } = useUserSession()
const { locale, t } = useI18n()
const hidden = useState('email-verify-hidden', () => false)
const show = computed(() => user.value?.emailVerified === false && !hidden.value)
const sending = ref(false)
const failed = ref('')
const result = ref<{ open: () => void }>()

async function resend() {
  sending.value = true
  failed.value = ''
  try {
    await $fetch('/api/me/verify-email', { method: 'POST', body: { locale: locale.value } })
  }
  catch (e) {
    failed.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
  result.value?.open()
}
</script>

<template>
  <aside v-if="show" class="email-verify" :aria-label="$t('auth.verifyTitle')">
    <p class="email-verify__text">✉️ {{ $t('auth.verifyBar') }}</p>
    <div class="email-verify__actions">
      <button type="button" class="btn btn--sm btn--primary" :disabled="sending" @click="resend">
        {{ sending ? $t('auth.wait') : $t('auth.verifyResend') }}
      </button>
      <button type="button" class="btn btn--sm" @click="hidden = true">{{ $t('auth.verifyHide') }}</button>
    </div>

    <ResultDialog
      ref="result" :icon="failed ? '⚠️' : '📬'" :tone="failed ? 'error' : 'default'"
      :title="failed ? t('auth.verifyErrorTitle') : t('auth.verifySentTitle')" :text="failed || t('auth.verifySent')"
    >
      <template #default="{ close }">
        <button type="button" class="btn btn--primary" autofocus @click="close">{{ $t('common.close') }}</button>
      </template>
    </ResultDialog>
  </aside>
</template>

<style lang="scss" scoped>
.email-verify {
  @include card(14px, 18px);
  @include stack($space-2);
  margin-bottom: $space-4;

  &__text { margin: 0; font-size: 14px; line-height: 1.45; }

  &__actions { @include cluster($space-2); }
}
</style>
