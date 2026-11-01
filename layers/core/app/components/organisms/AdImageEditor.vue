<script setup lang="ts">
import { AD_IMAGE_RATIO, type AdCrop } from '#shared/models'

/**
 * Posizione e dimensione dell'immagine nella cornice 4:3 dell'annuncio.
 * Si sposta trascinando, si ingrandisce o rimpicciolisce con la barra, la rotellina o due dita.
 * Rimpicciolita, attorno resta il colore di sfondo (utile per loghi e banner).
 */
const props = defineProps<{ src: string, initial?: AdCrop | null }>()
const crop = defineModel<AdCrop | null>({ default: null })

const MAX_ZOOM = 4
const BG_SWATCHES = ['#ffffff', '#000000', '#fff8f1', '#ffc83d', '#ff6f61']
const size = ref<{ w: number, h: number } | null>(null)
// zoom 1 = l'immagine riempie la cornice; cx, cy = centro della cornice in frazioni dell'immagine
const state = reactive({ zoom: 1, cx: 0.5, cy: 0.5, bg: '#ffffff' })

// Cornice a zoom 1, in frazioni dell'immagine
const cover = computed(() => {
  const s = size.value!
  return { w: Math.min(1, (s.h * AD_IMAGE_RATIO) / s.w), h: Math.min(1, s.w / AD_IMAGE_RATIO / s.h) }
})
// Zoom minimo: l'immagine intera dentro la cornice
const minZoom = computed(() => (size.value ? Math.min(cover.value.w, cover.value.h) : 1))

function onLoad(e: Event) {
  const img = e.target as HTMLImageElement
  size.value = { w: img.naturalWidth, h: img.naturalHeight }
  const c = props.initial
  if (c) Object.assign(state, { zoom: cover.value.w / c.w, cx: c.x + c.w / 2, cy: c.y + c.h / 2, bg: c.bg })
  else Object.assign(state, { zoom: 1, cx: 0.5, cy: 0.5 })
}
watch(() => props.src, () => (size.value = null))

function current() {
  const w = cover.value.w / state.zoom
  const h = cover.value.h / state.zoom
  return { x: state.cx - w / 2, y: state.cy - h / 2, w, h }
}
// Il centro resta dove l'immagine non scappa: più grande della cornice la copre sempre,
// più piccola resta tutta dentro
function settle() {
  const { w, h } = current()
  const clamp = (c: number, d: number) => Math.min(Math.max(c, Math.min(d / 2, 1 - d / 2)), Math.max(d / 2, 1 - d / 2))
  state.cx = clamp(state.cx, w)
  state.cy = clamp(state.cy, h)
}

watch([size, state], () => {
  crop.value = size.value ? { ...current(), bg: state.bg } : null
}, { deep: true, immediate: true })

const frame = ref<HTMLElement>()
const pointers = new Map<number, { x: number, y: number }>()
let pinch: { dist: number, zoom: number } | null = null
const distance = () => {
  const [a, b] = [...pointers.values()]
  return Math.hypot(a!.x - b!.x, a!.y - b!.y)
}
function onDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) pinch = { dist: distance(), zoom: state.zoom }
}
function onMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  if (!prev || !size.value || !frame.value) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pinch && pointers.size === 2) {
    setZoom(pinch.zoom * (distance() / pinch.dist))
    return
  }
  const { w, h } = current()
  const rect = frame.value.getBoundingClientRect()
  state.cx -= ((e.clientX - prev.x) / rect.width) * w
  state.cy -= ((e.clientY - prev.y) / rect.height) * h
  settle()
}
function onUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
}
function setZoom(z: number) {
  state.zoom = Math.min(MAX_ZOOM, Math.max(minZoom.value, z))
  settle()
}
const onWheel = (e: WheelEvent) => setZoom(state.zoom * Math.exp(-e.deltaY * 0.0015))
const fill = () => Object.assign(state, { zoom: 1, cx: 0.5, cy: 0.5 })
const whole = () => Object.assign(state, { zoom: minZoom.value, cx: 0.5, cy: 0.5 })
// Lo sfondo si vede solo se l'immagine non copre tutta la cornice
const showsBg = computed(() => !!size.value && state.zoom < 0.999)
</script>

<template>
  <div class="ad-image-editor">
    <img :src="src" alt="" class="ad-image-editor__probe" @load="onLoad">
    <div
      ref="frame" class="ad-image-editor__frame" :style="{ background: state.bg }"
      @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @wheel.prevent="onWheel"
    >
      <img v-if="size" :src="src" alt="Posizione dell'immagine" draggable="false" class="ad-image-editor__img" :style="adCropStyle(current())">
      <span class="ad-image-editor__grid" aria-hidden="true" />
    </div>
    <p class="ad-image-editor__help">Trascina per spostare · barra, rotellina o due dita per la dimensione</p>

    <div class="ad-image-editor__zoom">
      <button type="button" class="ad-image-editor__fit" :class="{ 'is-active': state.zoom <= minZoom + 0.001 }" @click="whole">Intera</button>
      <input
        type="range" :min="minZoom" :max="MAX_ZOOM" step="0.01" :value="state.zoom" aria-label="Dimensione dell'immagine"
        class="ad-image-editor__range" @input="setZoom(Number(($event.target as HTMLInputElement).value))"
      >
      <button type="button" class="ad-image-editor__fit" :class="{ 'is-active': Math.abs(state.zoom - 1) < 0.001 }" @click="fill">Riempi</button>
    </div>

    <div v-if="showsBg" class="ad-image-editor__bg" role="radiogroup" aria-label="Colore attorno all'immagine">
      <span class="ad-image-editor__bg-label">Sfondo</span>
      <button
        v-for="c in BG_SWATCHES" :key="c" type="button" role="radio" class="ad-image-editor__swatch" :class="{ 'is-active': state.bg === c }" :aria-checked="state.bg === c"
        :style="{ background: c }" :aria-label="`Sfondo ${c}`" @click="state.bg = c"
      />
      <label class="ad-image-editor__swatch ad-image-editor__swatch--custom" :class="{ 'is-active': !BG_SWATCHES.includes(state.bg) }" :style="!BG_SWATCHES.includes(state.bg) ? { background: state.bg } : undefined">
        <span class="ad-image-editor__plus" aria-hidden="true">+</span>
        <input v-model="state.bg" type="color" aria-label="Scegli un altro colore" class="ad-image-editor__picker">
      </label>
    </div>
    <p v-else class="ad-image-editor__hint">Rimpicciolisci l'immagine per mostrarla intera su uno sfondo colorato (utile per i loghi).</p>
  </div>
</template>

<style lang="scss" scoped>
$third-line: rgba(255, 255, 255, .5);

// Organismo: inquadratura dell'immagine di un annuncio (admin)
.ad-image-editor {
  @include stack($space-4);

  &__probe { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

  &__frame {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 22px;
    cursor: grab;
    touch-action: none;
    box-shadow: inset 0 0 0 2px var(--line);

    &:active { cursor: grabbing; }
  }

  &__img { position: absolute; max-width: none; pointer-events: none; user-select: none; }

  &__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent calc(33.33% - .5px), $third-line calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), $third-line calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px)),
      linear-gradient(180deg, transparent calc(33.33% - .5px), $third-line calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), $third-line calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px));
  }

  &__help { margin: -4px 0 0; text-align: center; font-size: 12px; color: var(--muted); font-weight: 700; }

  &__zoom { display: flex; align-items: center; gap: $space-4; }

  &__range { flex: 1; min-width: 0; accent-color: var(--coral); margin: 0; padding: 0; border: 0; background: none; height: 32px; }

  &__fit {
    flex-shrink: 0;
    border: 2px solid var(--line);
    @include pill(7px, 14px);
    font-weight: 800;
    font-size: 13px;
    background: var(--bg);
    color: var(--ink);
    cursor: pointer;

    &.is-active { background: var(--ink); border-color: var(--ink); color: var(--bg); }
  }

  &__bg { @include cluster($space-3); align-items: center; }

  &__bg-label { font-size: 13px; font-weight: 800; color: var(--muted); margin-right: 2px; }

  // Pallini grandi abbastanza per il dito (36 px)
  &__swatch {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    border: 2px solid var(--line);
    box-shadow: inset 0 0 0 2px var(--surface);

    &.is-active { border-color: var(--coral); border-width: 3px; }

    &--custom { position: relative; display: grid; place-items: center; background: conic-gradient(#ff6f61, #ffc83d, #45c79f, #7cc3f0, #b9a4ff, #ff6f61); }
  }

  &__plus { width: 18px; height: 18px; border-radius: 50%; background: var(--surface); display: grid; place-items: center; font-weight: 900; font-size: 14px; line-height: 1; color: var(--ink); }

  &__picker { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; padding: 0; border: 0; }

  &__hint { margin: 0; font-size: 12px; color: var(--muted); }
}
</style>
