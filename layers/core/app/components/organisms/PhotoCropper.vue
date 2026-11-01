<script setup lang="ts">
import { IMAGE_VARIANTS, VARIANT_KEYS, type Crop, type Crops, type ImageVariant } from '#shared/images'

/**
 * Ritaglio della foto nelle tre forme usate dal sito (verticale, orizzontale, quadrata).
 * Per ognuna si sposta la foto trascinandola e si ingrandisce con la barra, la rotellina o due dita.
 * Restituisce i ritagli in frazioni dell'immagine (v-model), pronti per il campo "crops" dell'upload.
 */
const props = defineProps<{ src: string }>()
const crops = defineModel<Crops | null>({ default: null })

const MAX_ZOOM = 4
const size = ref<{ w: number, h: number } | null>(null)
const active = ref<ImageVariant>('v')
// Per ogni forma: ingrandimento e centro del ritaglio (frazioni dell'immagine)
const state = reactive(Object.fromEntries(VARIANT_KEYS.map(v => [v, { zoom: 1, cx: 0.5, cy: 0.5 }])) as Record<ImageVariant, { zoom: number, cx: number, cy: number }>)

function onLoad(e: Event) {
  const img = e.target as HTMLImageElement
  size.value = { w: img.naturalWidth, h: img.naturalHeight }
  for (const v of VARIANT_KEYS) Object.assign(state[v], { zoom: 1, cx: 0.5, cy: 0.5 })
}
// Alcuni formati (HEIC fuori da Safari) il browser non li mostra: si carica lo stesso, con ritagli centrati
const failed = ref(false)
watch(() => props.src, () => {
  size.value = null
  failed.value = false
})

/** Ritaglio di una forma: il più grande possibile a zoom 1, tenuto dentro la foto */
function cropOf(v: ImageVariant): Crop {
  const s = size.value!
  const ratio = IMAGE_VARIANTS[v].ratio
  const { zoom, cx, cy } = state[v]
  const w = Math.min(1, (s.h * ratio) / s.w) / zoom
  const h = Math.min(1, s.w / ratio / s.h) / zoom
  const x = Math.min(Math.max(cx - w / 2, 0), 1 - w)
  const y = Math.min(Math.max(cy - h / 2, 0), 1 - h)
  return { x, y, w, h }
}
// Rimette il centro dove il ritaglio non esce dalla foto, così trascinare oltre il bordo non "accumula"
function settle(v: ImageVariant) {
  const c = cropOf(v)
  state[v].cx = c.x + c.w / 2
  state[v].cy = c.y + c.h / 2
}

watch([size, state], () => {
  crops.value = size.value ? Object.fromEntries(VARIANT_KEYS.map(v => [v, cropOf(v)])) as Crops : null
}, { deep: true, immediate: true })

// La foto dentro la cornice: dimensioni e posizione in percentuale della cornice
function imgStyle(v: ImageVariant) {
  if (!size.value) return {}
  const c = cropOf(v)
  return { width: `${100 / c.w}%`, height: `${100 / c.h}%`, left: `${(-c.x / c.w) * 100}%`, top: `${(-c.y / c.h) * 100}%` }
}

// Trascinamento (un dito o il mouse) e pinch (due dita)
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
  if (pointers.size === 2) pinch = { dist: distance(), zoom: state[active.value].zoom }
}
function onMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  if (!prev || !size.value || !frame.value) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const v = active.value
  if (pinch && pointers.size === 2) {
    setZoom(pinch.zoom * (distance() / pinch.dist))
    return
  }
  const c = cropOf(v)
  const rect = frame.value.getBoundingClientRect()
  state[v].cx = c.x + c.w / 2 - ((e.clientX - prev.x) / rect.width) * c.w
  state[v].cy = c.y + c.h / 2 - ((e.clientY - prev.y) / rect.height) * c.h
  settle(v)
}
function onUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
}
function setZoom(z: number) {
  state[active.value].zoom = Math.min(MAX_ZOOM, Math.max(1, z))
  settle(active.value)
}
function onWheel(e: WheelEvent) {
  setZoom(state[active.value].zoom * Math.exp(-e.deltaY * 0.0015))
}
function reset() {
  Object.assign(state[active.value], { zoom: 1, cx: 0.5, cy: 0.5 })
}
</script>

<template>
  <div class="photo-cropper">
    <img :src="src" alt="" class="photo-cropper__probe" @load="onLoad" @error="failed = true">
    <p v-if="failed" class="photo-cropper__failed">{{ $t('crop.failed') }}</p>
    <template v-else>
      <div class="photo-cropper__tabs" role="tablist" :aria-label="$t('crop.shapes')">
        <button
          v-for="v in VARIANT_KEYS" :key="v" type="button" role="tab" :aria-selected="active === v"
          class="photo-cropper__tab" :class="{ 'is-active': active === v }" @click="active = v"
        >
          <span class="photo-cropper__mini" :style="{ aspectRatio: IMAGE_VARIANTS[v].ratio }">
            <img v-if="size" :src="src" alt="" class="photo-cropper__img" :style="imgStyle(v)">
          </span>
          <b class="photo-cropper__tab-label">{{ $t(`crop.variant.${v}.label`) }}</b>
        </button>
      </div>

      <p class="photo-cropper__uses">{{ $t(`crop.variant.${active}.uses`) }}</p>
      <div
        ref="frame" class="photo-cropper__frame" :style="{ aspectRatio: IMAGE_VARIANTS[active].ratio, '--r': IMAGE_VARIANTS[active].ratio }"
        @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @wheel.prevent="onWheel"
      >
        <img v-if="size" :src="src" :alt="$t('crop.alt')" draggable="false" class="photo-cropper__img" :style="imgStyle(active)">
        <span class="photo-cropper__grid" aria-hidden="true" />
      </div>

      <div class="photo-cropper__zoom">
        <span aria-hidden="true">−</span>
        <input
          type="range" min="1" :max="MAX_ZOOM" step="0.01" :value="state[active].zoom" :aria-label="$t('crop.zoom')"
          class="photo-cropper__range" @input="setZoom(Number(($event.target as HTMLInputElement).value))"
        >
        <span aria-hidden="true">+</span>
        <button type="button" class="photo-cropper__reset" @click="reset">{{ $t('crop.center') }}</button>
      </div>
      <p class="photo-cropper__help">{{ $t('crop.help') }}</p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
$third-line: rgba(255, 255, 255, .45);

// Organismo: ritaglio della foto nelle tre forme usate dal sito
.photo-cropper {
  @include stack($space-4);

  &__probe { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

  &__tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-3; }

  &__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: $space-2;
    padding: 8px 6px;
    border: 2px solid transparent;
    border-radius: $radius-md;
    background: var(--surface);
    cursor: pointer;
    color: var(--muted);
    box-shadow: 0 6px 14px -10px var(--shadow);

    &.is-active { border-color: var(--coral); color: var(--ink); }
  }

  &__tab-label { font-size: 12px; font-weight: 900; }

  &__mini { position: relative; display: block; height: 52px; max-width: 100%; overflow: hidden; border-radius: 10px; background: var(--line); }

  &__img { position: absolute; max-width: none; pointer-events: none; user-select: none; }

  &__uses { margin: 0; text-align: center; font-size: 13px; font-weight: 800; color: var(--muted); }

  &__frame {
    position: relative;
    width: 100%;
    max-height: 52vh;
    // La cornice resta nelle proporzioni giuste anche quando l'altezza massima la limita
    max-width: calc(52vh * var(--r, 1));
    align-self: center;
    overflow: hidden;
    border-radius: 24px;
    background: var(--line);
    cursor: grab;
    touch-action: none;
    box-shadow: 0 14px 26px -16px var(--glow);

    &:active { cursor: grabbing; }
  }

  // Regola dei terzi
  &__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .7);
    background:
      linear-gradient(90deg, transparent calc(33.33% - .5px), $third-line calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), $third-line calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px)),
      linear-gradient(180deg, transparent calc(33.33% - .5px), $third-line calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), $third-line calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px));
  }

  &__zoom { display: flex; align-items: center; gap: $space-3; font-weight: 900; color: var(--muted); }

  &__range { flex: 1; accent-color: var(--coral); margin: 0; padding: 0; border: 0; background: none; }

  &__reset { border: 0; @include pill(6px, 12px); font-weight: 800; font-size: 13px; background: var(--coral-soft); color: var(--coral); cursor: pointer; }

  &__failed { margin: 0; padding: $space-6; border-radius: $radius-md; background: var(--surface); color: var(--muted); font-weight: 700; text-align: center; }

  &__help { margin: 0; text-align: center; font-size: 12px; color: var(--muted); }
}
</style>
