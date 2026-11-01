<script setup lang="ts">
import type { PhotoCredit } from '#shared/models'

export interface ViewerPhoto { image: string, alt: string, credit?: PhotoCredit | null }

/**
 * Foto a tutto schermo, intera e senza ritagli. Con più foto si sfoglia con le frecce,
 * i tasti ← → o uno swipe. In modalità `peek` (tieni premuto nei duelli) è solo da guardare:
 * niente pulsanti, e la chiude chi l'ha aperta quando si alza il dito.
 */
const props = defineProps<{ photos: ViewerPhoto[], peek?: boolean }>()
const index = defineModel<number | null>({ required: true })

const photo = computed(() => (index.value === null ? null : props.photos[index.value] ?? null))
const many = computed(() => props.photos.length > 1)

function go(step: number) {
  if (index.value === null || !many.value) return
  index.value = (index.value + step + props.photos.length) % props.photos.length
}
const close = () => (index.value = null)

function onKey(e: KeyboardEvent) {
  if (props.peek || index.value === null) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') go(-1)
  if (e.key === 'ArrowRight') go(1)
}

// Swipe orizzontale per sfogliare, verso il basso per chiudere
let start: { x: number, y: number } | null = null
function onDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY }
}
function onUp(e: PointerEvent) {
  if (!start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  start = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  else if (dy > 90) close()
}

// Mentre è aperta la pagina sotto non scorre; alla chiusura il focus torna dov'era
const closeBtn = ref<HTMLButtonElement>()
let returnFocus: HTMLElement | null = null
watch(() => index.value !== null, (open) => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = open ? 'hidden' : ''
  if (props.peek) return
  if (open) {
    returnFocus = document.activeElement as HTMLElement | null
    nextTick(() => closeBtn.value?.focus())
  }
  else returnFocus?.focus()
})

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (index.value !== null) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="photo" class="photo-viewer" :class="{ 'photo-viewer--peek': peek }" role="dialog" aria-modal="true" :aria-label="photo.alt"
        @click.self="close" @pointerdown="onDown" @pointerup="onUp"
      >
        <img :key="photo.image" :src="photo.image" :alt="photo.alt" draggable="false" class="photo-viewer__img">

        <template v-if="!peek">
          <button ref="closeBtn" type="button" class="photo-viewer__btn photo-viewer__btn--close" :aria-label="$t('common.close')" @click="close">✕</button>
          <template v-if="many">
            <button type="button" class="photo-viewer__btn photo-viewer__btn--prev" :aria-label="$t('photo.prev')" @click="go(-1)">‹</button>
            <button type="button" class="photo-viewer__btn photo-viewer__btn--next" :aria-label="$t('photo.next')" @click="go(1)">›</button>
          </template>
          <div class="photo-viewer__foot">
            <span v-if="many">{{ index! + 1 }} / {{ photos.length }}</span>
            <a v-if="photo.credit" :href="photo.credit.url ?? undefined" target="_blank" rel="noopener noreferrer nofollow ugc" class="photo-viewer__credit">{{ $t('photo.credit', { text: photo.credit.text }) }}</a>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// Molecola: foto a tutto schermo, con frecce e crediti
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: max(56px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(56px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background: rgba(24, 13, 8, .92);
  touch-action: none;
  user-select: none;

  &--peek { pointer-events: none; padding: 24px 12px; background: rgba(24, 13, 8, .82); }

  &__img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: $radius-md;
    box-shadow: 0 24px 60px -20px rgba(0, 0, 0, .8);
  }

  &__btn {
    position: absolute;
    border: 0;
    cursor: pointer;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, .14);
    color: #fff;
    border-radius: 50%;
    font-weight: 700;

    &:hover, &:focus-visible { background: rgba(255, 255, 255, .26); }

    &--close { top: max(10px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); width: 42px; height: 42px; font-size: 18px; }

    &--prev, &--next { top: 50%; width: 46px; height: 46px; margin-top: -23px; font-size: 32px; line-height: 1; padding-bottom: 4px; }

    &--prev { left: max(10px, env(safe-area-inset-left)); }

    &--next { right: max(10px, env(safe-area-inset-right)); }
  }

  &__foot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: max(12px, env(safe-area-inset-bottom));
    padding-inline: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
  }

  &__credit { color: rgba(255, 255, 255, .75); font-size: 11px; font-weight: 600; text-decoration: none; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.viewer-enter-active, .viewer-leave-active { transition: opacity .2s; }

.viewer-enter-active .photo-viewer__img {
  transition: transform .25s cubic-bezier(.2, .8, .2, 1);

  @media (prefers-reduced-motion: reduce) { transition: none; }
}

.viewer-enter-from, .viewer-leave-to { opacity: 0; }

.viewer-enter-from .photo-viewer__img { transform: scale(.88); }
</style>
