<script setup lang="ts">
import type { Crop } from '#shared/images'

/**
 * Cornice di ritaglio con proporzioni fisse: si trascina l'immagine per spostarla e si ingrandisce
 * con la barra (fuori, v-model:zoom), la rotellina, due dita o i tasti (frecce, + e -).
 * Riempie il contenitore, che decide forma e misura. Restituisce il ritaglio in frazioni dell'immagine.
 */
const props = defineProps<{ src: string, ratio: number, initial?: Crop | null, label: string }>()
const crop = defineModel<Crop | null>('crop', { default: null })
const zoom = defineModel<number>('zoom', { default: 1 })
const emit = defineEmits<{ size: [{ w: number, h: number }] }>()

const MAX_ZOOM = 4
const size = ref<{ w: number, h: number } | null>(null)
const center = reactive({ cx: 0.5, cy: 0.5 })

// Riquadro più grande con le proporzioni giuste a zoom 1
const base = () => {
  const s = size.value!
  return { w: Math.min(1, (s.h * props.ratio) / s.w), h: Math.min(1, s.w / props.ratio / s.h) }
}

function onLoad(e: Event) {
  const img = e.target as HTMLImageElement
  size.value = { w: img.naturalWidth, h: img.naturalHeight }
  emit('size', size.value)
  const b = base()
  const start = props.initial
  zoom.value = start ? Math.min(MAX_ZOOM, Math.max(1, b.w / start.w)) : 1
  center.cx = start ? start.x + start.w / 2 : 0.5
  center.cy = start ? start.y + start.h / 2 : 0.5
}
watch(() => props.src, () => (size.value = null))

const current = computed<Crop | null>(() => {
  if (!size.value) return null
  const b = base()
  const w = b.w / zoom.value
  const h = b.h / zoom.value
  return { x: Math.min(Math.max(center.cx - w / 2, 0), 1 - w), y: Math.min(Math.max(center.cy - h / 2, 0), 1 - h), w, h }
})
watch(current, c => (crop.value = c), { immediate: true })

// Il centro torna dove il ritaglio resta dentro l'immagine, così spingere oltre il bordo non "accumula"
function settle() {
  const c = current.value
  if (!c) return
  center.cx = c.x + c.w / 2
  center.cy = c.y + c.h / 2
}
function setZoom(z: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(1, z))
  settle()
}
watch(zoom, () => settle())

const imgStyle = computed(() => {
  const c = current.value
  if (!c) return { width: '100%', height: '100%', objectFit: 'cover' as const }
  return { width: `${100 / c.w}%`, height: `${100 / c.h}%`, left: `${(-c.x / c.w) * 100}%`, top: `${(-c.y / c.h) * 100}%` }
})

// Trascinamento (dito o mouse) e pinch con due dita
const frame = ref<HTMLElement>()
const pointers = new Map<number, { x: number, y: number }>()
let pinch: { dist: number, zoom: number } | null = null
const distance = () => {
  const [a, b] = [...pointers.values()]
  return Math.hypot(a!.x - b!.x, a!.y - b!.y)
}
function onDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  catch { /* puntatore già rilasciato */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) pinch = { dist: distance(), zoom: zoom.value }
}
function onMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  const c = current.value
  if (!prev || !c || !frame.value) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pinch && pointers.size === 2) return setZoom(pinch.zoom * (distance() / pinch.dist))
  const rect = frame.value.getBoundingClientRect()
  center.cx -= ((e.clientX - prev.x) / rect.width) * c.w
  center.cy -= ((e.clientY - prev.y) / rect.height) * c.h
  settle()
}
function onUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
}
function onWheel(e: WheelEvent) {
  setZoom(zoom.value * (e.deltaY < 0 ? 1.08 : 1 / 1.08))
}
function onKey(e: KeyboardEvent) {
  const c = current.value
  if (!c) return
  const step = 0.05
  const moves: Record<string, () => void> = {
    ArrowLeft: () => (center.cx -= c.w * step),
    ArrowRight: () => (center.cx += c.w * step),
    ArrowUp: () => (center.cy -= c.h * step),
    ArrowDown: () => (center.cy += c.h * step),
    '+': () => setZoom(zoom.value * 1.1),
    '=': () => setZoom(zoom.value * 1.1),
    '-': () => setZoom(zoom.value / 1.1),
  }
  const move = moves[e.key]
  if (!move) return
  e.preventDefault()
  move()
  settle()
}
</script>

<template>
  <div
    ref="frame" class="crop-frame" tabindex="0" role="application" :aria-label="label"
    @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @wheel.prevent="onWheel" @keydown="onKey"
  >
    <img :src="src" alt="" class="crop-frame__img" :style="imgStyle" draggable="false" @load="onLoad">
  </div>
</template>

<style lang="scss" scoped>
// Molecola: cornice dove si sposta e ingrandisce un'immagine per ritagliarla
.crop-frame {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  border-radius: inherit;

  &:active { cursor: grabbing; }

  &:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

  &__img { position: absolute; max-width: none; pointer-events: none; }
}
</style>
