<script setup lang="ts">
import { SHELTER_IMAGES, shelterImageSources, type ShelterImageKind } from '#shared/images'

/**
 * Banner o logo del rifugio: si sceglie una foto, la si sposta nella cornice trascinandola
 * e la si salva subito (non aspetta il "Salva" del resto del modulo).
 */
const props = defineProps<{ kind: ShelterImageKind, id: string | null }>()
const emit = defineEmits<{ change: [id: string | null] }>()

const ratio = SHELTER_IMAGES[props.kind].ratio
const file = ref<File | null>(null)
const preview = ref('')
const focus = reactive({ x: 0.5, y: 0.5 })
const busy = ref(false)
const error = ref('')
const input = ref<HTMLInputElement>()
const current = computed(() => (props.id ? shelterImageSources(props.id, props.kind) : null))

function pick(f: File | undefined) {
  if (!f?.type.startsWith('image/')) return
  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = f
  preview.value = URL.createObjectURL(f)
  Object.assign(focus, { x: 0.5, y: 0.5 })
  error.value = ''
}
function cancel() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = null
  preview.value = ''
  if (input.value) input.value.value = ''
}
onBeforeUnmount(cancel)

// Trascinando si sposta la foto dentro la cornice (object-position in percentuale)
let start: { px: number, py: number, x: number, y: number, w: number, h: number } | null = null
function down(e: PointerEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  start = { px: e.clientX, py: e.clientY, x: focus.x, y: focus.y, w: r.width, h: r.height };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!start) return
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  focus.x = clamp(start.x - ((e.clientX - start.px) / start.w) * 1.5)
  focus.y = clamp(start.y - ((e.clientY - start.py) / start.h) * 1.5)
}
const up = () => (start = null)
function nudge(dx: number, dy: number) {
  focus.x = Math.min(1, Math.max(0, focus.x + dx))
  focus.y = Math.min(1, Math.max(0, focus.y + dy))
}

async function save() {
  if (!file.value) return
  busy.value = true
  error.value = ''
  const body = new FormData()
  body.append('kind', props.kind)
  body.append('fx', String(focus.x))
  body.append('fy', String(focus.y))
  body.append('photo', file.value)
  try {
    const { id } = await $fetch<{ id: string }>('/api/shelters/me/image', { method: 'POST', body })
    emit('change', id)
    cancel()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}
async function remove() {
  busy.value = true
  try {
    await $fetch('/api/shelters/me/image', { method: 'DELETE', query: { kind: props.kind } })
    emit('change', null)
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="image-picker" :class="`image-picker--${kind}`">
    <div
      v-if="preview"
      class="image-picker__frame image-picker__frame--editing"
      :style="{ aspectRatio: ratio }"
      tabindex="0"
      :aria-label="$t('shelterEdit.dragHint')"
      @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up"
      @keydown.left.prevent="nudge(-0.05, 0)" @keydown.right.prevent="nudge(0.05, 0)"
      @keydown.up.prevent="nudge(0, -0.05)" @keydown.down.prevent="nudge(0, 0.05)"
    >
      <img :src="preview" alt="" draggable="false" class="image-picker__img" :style="{ objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }">
    </div>
    <div v-else class="image-picker__frame" :style="{ aspectRatio: ratio }">
      <picture v-if="current">
        <source type="image/avif" :srcset="current.avif" :sizes="kind === 'banner' ? '(min-width: 760px) 680px, 100vw' : '120px'">
        <source type="image/webp" :srcset="current.webp" :sizes="kind === 'banner' ? '(min-width: 760px) 680px, 100vw' : '120px'">
        <img :src="current.src" alt="" class="image-picker__img">
      </picture>
      <span v-else class="image-picker__empty" aria-hidden="true">{{ kind === 'banner' ? '🏞️' : '🐾' }}</span>
    </div>

    <div class="image-picker__side">
      <p v-if="preview" class="hint">{{ $t('shelterEdit.dragHint') }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="image-picker__buttons">
        <template v-if="preview">
          <button type="button" class="btn btn--ghost" :disabled="busy" @click="cancel">{{ $t('common.cancel') }}</button>
          <button type="button" class="btn btn--primary" :disabled="busy" @click="save">{{ busy ? $t('common.sending') : $t('shelterEdit.useImage') }}</button>
        </template>
        <template v-else>
          <label class="btn btn--ghost image-picker__choose">
            {{ id ? $t('shelterEdit.change') : $t('shelterEdit.choose') }}
            <input ref="input" type="file" accept="image/*" class="u-visually-hidden" @change="pick(($event.target as HTMLInputElement).files?.[0])">
          </label>
          <button v-if="id" type="button" class="btn btn--link" :disabled="busy" @click="remove">{{ $t('shelterEdit.remove') }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: scelta e inquadratura di banner o logo del rifugio
.image-picker {
  @include stack($space-3);
  width: 100%;

  &--logo { flex-direction: row; align-items: center; gap: $space-6; }

  &__frame {
    position: relative;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    border-radius: $radius-md;
    background: var(--bg);
    border: 2px dashed var(--line);
    display: grid;
    place-items: center;

    .image-picker--logo & { width: 104px; flex: none; border-radius: 50%; }

    &--editing {
      cursor: grab;
      touch-action: none;
      border-style: solid;
      border-color: var(--coral);

      &:active { cursor: grabbing; }

      .image-picker__img { user-select: none; pointer-events: none; }
    }
  }

  &__img { width: 100%; height: 100%; display: block; object-fit: cover; }

  &__empty { font-size: 34px; opacity: .6; }

  &__side { @include stack($space-2); min-width: 0; }

  &__buttons { @include cluster($space-3); align-items: center; }

  &__choose:focus-within { outline: 2px solid var(--coral); }
}
</style>
