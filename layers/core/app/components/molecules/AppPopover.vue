<script setup lang="ts">
// Molecola: fumetto che si apre al tocco del bottone (lo slot "trigger") e mostra un breve testo.
// Si chiude con un secondo tocco, toccando fuori o con Esc; resta dentro lo schermo spostandosi di lato
const props = withDefaults(defineProps<{
  /** Lato del bottone su cui si apre */
  placement?: 'bottom' | 'top'
  /** Etichetta accessibile del fumetto */
  label?: string
}>(), { placement: 'bottom', label: undefined })

const open = defineModel<boolean>('open', { default: false })

const id = useId()
const root = ref<HTMLElement | null>(null)
const bubble = ref<HTMLElement | null>(null)
const shift = ref(0)

const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }

// Sposta il fumetto di lato se uscirebbe dallo schermo (la freccia resta sul bottone)
async function fit() {
  shift.value = 0
  await nextTick()
  const el = bubble.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const margin = 8
  const vw = document.documentElement.clientWidth
  if (r.left < margin) shift.value = margin - r.left
  else if (r.right > vw - margin) shift.value = vw - margin - r.right
}

function onPointerDown(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) close()
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  close()
  root.value?.querySelector<HTMLElement>('[aria-controls]')?.focus()
}

// Ascolta fuori dal fumetto solo mentre è aperto
function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onPointerDown as EventListener)
  document[method]('keydown', onKey as EventListener)
}

watch(open, (v) => {
  listen(v)
  if (v) fit()
}, { flush: 'post' })

onMounted(() => { if (open.value) { listen(true); fit() } })
onBeforeUnmount(() => listen(false))
</script>

<template>
  <span ref="root" class="app-popover" :class="`app-popover--${props.placement}`">
    <slot name="trigger" :open="open" :toggle="toggle" :attrs="{ 'aria-expanded': open, 'aria-controls': id }" />
    <Transition name="app-popover">
      <span
        v-if="open" :id="id" ref="bubble" class="app-popover__bubble" role="status" :aria-label="label"
        :style="{ '--shift': `${shift}px` }"
      >
        <slot />
      </span>
    </Transition>
  </span>
</template>

<style lang="scss" scoped>
.app-popover {
  position: relative;
  display: inline-flex;

  &__bubble {
    --gap: 10px;
    position: absolute;
    left: 50%;
    z-index: 30;
    width: max-content;
    max-width: min(260px, calc(100vw - 16px));
    transform: translateX(calc(-50% + var(--shift, 0px)));
    padding: $space-3 $space-5;
    border-radius: $radius-sm;
    background: var(--ink);
    color: var(--bg);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    text-align: left;
    box-shadow: 0 12px 28px -10px var(--shadow);

    // Freccia: resta centrata sul bottone anche quando il fumetto si sposta
    &::before {
      content: '';
      position: absolute;
      left: calc(50% - var(--shift, 0px));
      width: 12px;
      height: 12px;
      margin-left: -6px;
      background: inherit;
      border-radius: 2px;
      transform: rotate(45deg);
    }
  }

  &--bottom &__bubble {
    top: calc(100% + var(--gap));

    &::before { top: -5px; }
  }

  &--top &__bubble {
    bottom: calc(100% + var(--gap));

    &::before { bottom: -5px; }
  }
}

.app-popover-enter-active, .app-popover-leave-active { transition: opacity .15s, margin .15s; }

.app-popover-enter-from, .app-popover-leave-to { opacity: 0; margin-top: -4px; }

@media (prefers-reduced-motion: reduce) {
  .app-popover-enter-active, .app-popover-leave-active { transition: none; }
}
</style>
