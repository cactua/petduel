<script setup lang="ts">
// autoOpen: si apre da sola (arrivando da un avviso di festa o dal riquadro in classifica)
const props = defineProps<{ petId: number, petName: string, sfida?: string, label?: string, autoOpen?: boolean }>()

const dialog = ref<HTMLDialogElement>()
const cardUrl = computed(() => `/card/${props.petId}.png${props.sfida ? `?sfida=${props.sfida}` : ''}`)
const fileName = computed(() => `${props.petName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pet'}-petduel.png`)
const { t } = useI18n()
const text = computed(() => props.sfida
  ? `${t('share.textChallenge', { name: props.petName })} 🏆`
  : `${t('share.text', { name: props.petName })} 🐾`)

const file = ref<File | null>(null)
const canShareFile = ref(false)
const canShareLink = ref(false)
const status = ref('')

function link() {
  const url = new URL(`/pet/${props.petId}`, location.origin)
  if (props.sfida) url.searchParams.set('sfida', props.sfida)
  return url.toString()
}

// L'immagine si scarica all'apertura: su iOS la condivisione deve partire subito dal tocco, senza attese
async function open() {
  status.value = ''
  dialog.value?.showModal()
  canShareLink.value = typeof navigator.share === 'function'
  if (file.value) return
  try {
    const blob = await $fetch<Blob>(cardUrl.value, { responseType: 'blob' })
    file.value = new File([blob], fileName.value, { type: 'image/png' })
    canShareFile.value = !!navigator.canShare?.({ files: [file.value] })
  }
  catch {
    status.value = t('share.prepareFailed')
  }
}

onMounted(() => props.autoOpen && open())

async function share() {
  try {
    if (canShareFile.value && file.value) await navigator.share({ files: [file.value], text: `${text.value} ${link()}` })
    else await navigator.share({ title: 'PetDuel', text: text.value, url: link() })
  }
  catch (e) {
    if ((e as Error).name !== 'AbortError') status.value = t('share.failed')
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(link())
    status.value = t('share.copied')
  }
  catch {
    status.value = link()
  }
}
</script>

<template>
  <span class="share-card">
    <button type="button" class="share-card__open" @click="open">{{ label ?? $t('share.share') }}</button>
    <dialog ref="dialog" class="share-card__sheet" :aria-label="$t('share.title', { name: petName })" @click.self="dialog?.close()">
      <div class="share-card__inner">
        <header class="share-card__head">
          <h2 class="share-card__title">{{ $t('share.title', { name: petName }) }}</h2>
          <button type="button" class="share-card__close" :aria-label="$t('common.close')" @click="dialog?.close()">✕</button>
        </header>
        <img :src="cardUrl" :alt="$t('share.cardAlt', { name: petName })" class="share-card__preview">
        <div class="share-card__actions">
          <button v-if="canShareLink" type="button" class="btn btn--primary btn--lg" @click="share">
            {{ canShareFile ? $t('share.shareImage') : $t('share.shareLink') }}
          </button>
          <a :href="cardUrl" :download="fileName" class="btn btn--ghost btn--lg">{{ $t('share.download') }}</a>
          <button type="button" class="btn btn--ghost btn--lg" @click="copy">{{ $t('share.copy') }}</button>
        </div>
        <p class="share-card__hint">{{ $t('share.hint', { name: petName }) }}</p>
        <p v-if="status" class="share-card__status" role="status">{{ status }}</p>
      </div>
    </dialog>
  </span>
</template>

<style lang="scss" scoped>
// Molecola: bottone che apre il foglio per condividere la card del pet
.share-card {
  &__open {
    border: 0;
    @include pill(8px, 16px);
    font-weight: 800;
    cursor: pointer;
    background: var(--ink);
    color: var(--bg);
  }

  &__sheet {
    border: 0;
    padding: 0;
    background: var(--surface);
    color: var(--ink);
    width: min(440px, 100vw);
    max-width: 100vw;
    max-height: 100dvh;
    border-radius: 24px;
    overflow-y: auto;
    scrollbar-width: none;

    &::backdrop { background: rgba(20, 10, 5, .55); }

    @include mq-down(sm) { margin: auto 0 0; width: 100vw; border-radius: 24px 24px 0 0; }
  }

  &__inner {
    @include stack($space-5);
    padding: 16px;

    @include mq-down(sm) { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  }

  &__head { display: flex; align-items: center; gap: $space-3; }

  &__title { font-size: 20px; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__close { border: 0; background: var(--bg); border-radius: $radius-pill; width: 36px; height: 36px; cursor: pointer; font-size: 16px; }

  &__preview { width: auto; max-height: 52dvh; aspect-ratio: 9 / 16; align-self: center; border-radius: 16px; background: var(--line); }

  &__actions { @include stack($space-3); }

  &__hint { margin: 0; font-size: 13px; color: var(--muted); text-align: center; }

  &__status { margin: 0; font-weight: 700; color: var(--mint); text-align: center; word-break: break-all; }
}
</style>
