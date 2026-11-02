<script setup lang="ts">
import { PHOTO_REPORT_REASONS, USER_REPORT_REASONS, type ReportInput, type ReportReason } from '#shared/models'

/**
 * Molecola: "Segnala" un'immagine pubblicata (photoId) o un profilo (username) ai moderatori.
 * Apre un foglio con il motivo e una nota facoltativa; chi non è collegato viene mandato ad accedere
 */
const props = defineProps<{ photoId?: number, username?: string, preset?: ReportReason, label?: string }>()

const { loggedIn } = useUserSession()
const route = useRoute()
const dialog = ref<HTMLDialogElement>()
const reasons = computed<readonly ReportReason[]>(() => (props.photoId ? PHOTO_REPORT_REASONS : USER_REPORT_REASONS))
const reason = ref<ReportReason | null>(null)
const note = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref('')
const id = useId()

function open() {
  if (!loggedIn.value) return navigateTo({ path: '/accedi', query: { redirect: route.fullPath } })
  reason.value = props.preset ?? null
  note.value = ''
  sent.value = false
  error.value = ''
  dialog.value?.showModal()
}

async function send() {
  if (!reason.value) return
  error.value = ''
  sending.value = true
  // Il motivo viene dalla lista giusta per il tipo di segnalazione (reasons), il server lo ricontrolla
  const body = (props.photoId
    ? { target: 'photo', id: props.photoId, reason: reason.value, note: note.value }
    : { target: 'user', username: props.username ?? '', reason: reason.value, note: note.value }) as ReportInput
  try {
    await $fetch('/api/reports', { method: 'POST', body })
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
  <span class="report-button">
    <button type="button" class="report-button__open" @click.stop="open">⚑ {{ label ?? $t('report.open') }}</button>
    <dialog ref="dialog" class="report-button__sheet" :aria-labelledby="`${id}-title`" @click.self="dialog?.close()" @pointerdown.stop @pointerup.stop>
      <form class="report-button__inner" @submit.prevent="send">
        <header class="report-button__head">
          <h2 :id="`${id}-title`" class="report-button__title">{{ photoId ? $t('report.titlePhoto') : $t('report.titleUser') }}</h2>
          <button type="button" class="report-button__close" :aria-label="$t('common.close')" @click="dialog?.close()">✕</button>
        </header>
        <template v-if="!sent">
          <fieldset class="report-button__reasons">
            <legend class="label">{{ $t('report.why') }}</legend>
            <label v-for="r in reasons" :key="r" class="report-button__reason" :class="{ 'is-active': reason === r }">
              <input v-model="reason" type="radio" :name="`${id}-reason`" :value="r" class="report-button__radio">
              {{ $t(`report.reason.${r}`) }}
            </label>
          </fieldset>
          <div class="field">
            <label :for="`${id}-note`" class="label">{{ $t('report.note') }} <small>({{ $t('common.optional') }})</small></label>
            <textarea :id="`${id}-note`" v-model="note" maxlength="300" rows="3" class="input" :placeholder="$t('report.notePlaceholder')" />
          </div>
          <p class="report-button__hint">{{ $t('report.hint') }} <NuxtLink to="/regole" target="_blank">{{ $t('rules.link') }}</NuxtLink></p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <button type="submit" class="btn btn--primary" :disabled="!reason || sending">{{ sending ? $t('auth.wait') : $t('report.send') }}</button>
        </template>
        <template v-else>
          <p class="report-button__thanks" role="status">💜 {{ $t('report.thanks') }}</p>
          <button type="button" class="btn btn--ghost" @click="dialog?.close()">{{ $t('common.close') }}</button>
        </template>
      </form>
    </dialog>
  </span>
</template>

<style lang="scss" scoped>
.report-button {
  &__open {
    border: 0;
    padding: 4px 6px;
    background: none;
    color: inherit;
    opacity: .75;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;

    &:hover, &:focus-visible { opacity: 1; text-decoration: underline; }
  }

  &__sheet {
    border: 0;
    padding: 0;
    background: var(--surface);
    color: var(--ink);
    // Dentro il visore delle foto erediterebbe il testo centrato
    text-align: left;
    width: min(440px, 100vw);
    max-width: 100vw;
    max-height: 100dvh;
    border-radius: 24px;
    overflow-y: auto;

    &::backdrop { background: rgba(20, 10, 5, .55); }

    @include mq-down(sm) { margin: auto 0 0; width: 100vw; border-radius: 24px 24px 0 0; }
  }

  &__inner {
    @include stack($space-5);
    padding: 16px;

    @include mq-down(sm) { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  }

  &__head { display: flex; align-items: center; gap: $space-3; }

  &__title { font-size: 20px; margin-right: auto; }

  &__close { border: 0; background: var(--bg); border-radius: $radius-pill; width: 36px; height: 36px; cursor: pointer; font-size: 16px; color: var(--ink); }

  &__reasons {
    @include stack($space-2);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  &__reason {
    display: flex;
    gap: $space-3;
    align-items: center;
    padding: 10px 12px;
    border: 2px solid var(--line);
    border-radius: $radius-md;
    font-weight: 700;
    cursor: pointer;

    &.is-active { border-color: var(--action); background: var(--coral-soft); }
  }

  &__radio { accent-color: var(--action); }

  &__hint { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }

  &__thanks { margin: 0; font-weight: 800; line-height: 1.5; }
}
</style>
