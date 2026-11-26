<script setup lang="ts">
// Organismo: promemoria per confermare l'email, in cima alle pagine finché non la si conferma.
// Si può nascondere per questa visita; il link si può farsi rimandare, e com'è andata lo dice una modale
const { user } = useUserSession()
const { locale } = useI18n()
const hidden = useState('email-verify-hidden', () => false)
const show = computed(() => user.value?.emailVerified === false && !hidden.value)
const sending = ref(false)
const failed = ref('')
const dialog = ref<HTMLDialogElement>()
const id = useId()

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
  dialog.value?.showModal()
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

    <dialog
      ref="dialog" class="email-verify__dialog" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-text`"
      @click.self="dialog?.close()">
      <div class="email-verify__inner">
        <span class="email-verify__icon" :class="{ 'is-error': failed }" aria-hidden="true">{{ failed ? '⚠️' : '📬' }}</span>
        <h2 :id="`${id}-title`" class="email-verify__title">
          {{ failed ? $t('auth.verifyErrorTitle') : $t('auth.verifySentTitle') }}
        </h2>
        <p :id="`${id}-text`" class="email-verify__body">{{ failed || $t('auth.verifySent') }}</p>
        <form method="dialog">
          <button type="submit" class="btn btn--primary email-verify__ok" autofocus>{{ $t('common.close') }}</button>
        </form>
      </div>
    </dialog>
  </aside>
</template>

<style lang="scss" scoped>
.email-verify {
  @include card(14px, 18px);
  @include stack($space-2);
  margin-bottom: $space-4;

  &__text { margin: 0; font-size: 14px; line-height: 1.45; }

  &__actions { @include cluster($space-2); }

  &__dialog {
    border: 0;
    padding: 0;
    background: var(--surface);
    color: var(--ink);
    width: min(400px, calc(100vw - 32px));
    border-radius: 24px;

    &::backdrop { background: rgba(20, 10, 5, .55); }

    &[open] { animation: email-verify-in .18s ease-out; }

    @media (prefers-reduced-motion: reduce) {
      &[open] { animation: none; }
    }
  }

  &__inner {
    @include stack($space-3);
    align-items: center;
    padding: 28px 24px 22px;
    text-align: center;
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--coral-soft);
    font-size: 30px;

    &.is-error { background: var(--bg); }
  }

  &__title { margin: 0; font-size: 21px; }

  &__body { margin: 0; font-size: 15px; line-height: 1.5; color: var(--muted); }

  &__ok { margin-top: $space-2; min-width: 140px; }
}

@keyframes email-verify-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: none; }
}
</style>
