<script setup lang="ts">
/**
 * Molecola: modale centrata che dice com'è andata un'azione (email rimandata, immagine inviata…):
 * icona grande, titolo, testo e i pulsanti nello slot. Si apre con open(); si chiude con Esc, cliccando fuori
 * o con un pulsante dello slot che chiama close. Il focus va sul primo pulsante (autofocus nello slot)
 */
defineProps<{ icon: string, title: string, text: string, tone?: 'default' | 'error' }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const id = useId()

// "close" parte subito da qui (pulsanti, clic fuori) e anche dall'evento del <dialog> (Esc), che non tutti
// i browser mandano in modo affidabile: chi ascolta deve sopportare di riceverlo due volte
function close() {
  if (!dialog.value?.open) return
  dialog.value.close()
  emit('close')
}

defineExpose({
  open: () => dialog.value?.showModal(),
  close,
})
</script>

<template>
  <dialog
    ref="dialog" class="result-dialog" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-text`"
    @click.self="close" @close="emit('close')"
  >
    <div class="result-dialog__inner">
      <span class="result-dialog__icon" :class="{ 'is-error': tone === 'error' }" aria-hidden="true">{{ icon }}</span>
      <h2 :id="`${id}-title`" class="result-dialog__title">{{ title }}</h2>
      <p :id="`${id}-text`" class="result-dialog__text">{{ text }}</p>
      <div class="result-dialog__actions">
        <slot :close="close" />
      </div>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.result-dialog {
  border: 0;
  padding: 0;
  background: var(--surface);
  color: var(--ink);
  width: min(420px, calc(100vw - 32px));
  border-radius: 24px;

  &::backdrop { background: rgba(20, 10, 5, .55); }

  &[open] { animation: result-dialog-in .18s ease-out; }

  @media (prefers-reduced-motion: reduce) {
    &[open] { animation: none; }
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

  &__text { margin: 0; font-size: 15px; line-height: 1.5; color: var(--muted); }

  &__actions {
    @include stack($space-2);
    align-self: stretch;
    margin-top: $space-2;
  }
}

@keyframes result-dialog-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: none; }
}
</style>
