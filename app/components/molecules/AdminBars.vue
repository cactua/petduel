<script setup lang="ts">
// Barre per giorno, una serie sola: altezza dal valore, al passaggio il numero esatto.
// La serie è nominata dal titolo, quindi niente legenda
const props = defineProps<{ title: string, days: { day: string, value: number }[], color?: string }>()
const max = computed(() => Math.max(1, ...props.days.map(d => d.value)))
const total = computed(() => props.days.reduce((s, d) => s + d.value, 0))
const label = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
</script>

<template>
  <figure class="admin-bars">
    <figcaption class="admin-bars__caption"><span>{{ title }}</span><b class="admin-bars__total">{{ total.toLocaleString('it-IT') }}</b></figcaption>
    <div class="admin-bars__plot" role="list">
      <div
        v-for="d in days" :key="d.day" class="admin-bars__col" role="listitem" tabindex="0"
        :aria-label="`${label(d.day)}: ${d.value}`"
      >
        <span class="admin-bars__bar" :style="{ height: d.value ? `max(3px, ${(d.value / max) * 100}%)` : '0', background: color ?? 'var(--coral)' }" />
        <span class="admin-bars__tip">{{ label(d.day) }} · <b>{{ d.value.toLocaleString('it-IT') }}</b></span>
      </div>
    </div>
    <div class="admin-bars__axis" aria-hidden="true"><span>{{ label(days[0]!.day) }}</span><span>oggi</span></div>
  </figure>
</template>

<style lang="scss" scoped>
// Molecola: istogramma di 30 giorni per il pannello admin
.admin-bars {
  margin: 0;
  @include card(14px 14px 10px, $radius-lg);
  @include stack($space-3);
  min-width: 0;

  // Dentro un'altra scheda: niente ombra, fondo leggero
  &--flat { box-shadow: none; background: var(--bg); }

  &__caption { display: flex; justify-content: space-between; align-items: baseline; gap: $space-3; font-weight: 800; font-size: 14px; color: var(--muted); }

  &__total { color: var(--ink); font-size: 18px; font-variant-numeric: tabular-nums; }

  &__plot { height: 84px; display: flex; align-items: flex-end; gap: 2px; border-bottom: 1px solid var(--line); }

  &__col {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    position: relative;
    outline: none;
    cursor: default;

    &:hover, &:focus-visible {
      .admin-bars__bar { opacity: .7; }

      .admin-bars__tip { opacity: 1; }
    }

    &:first-child .admin-bars__tip { left: 0; transform: none; }

    &:last-child .admin-bars__tip { left: auto; right: 0; transform: none; }
  }

  &__bar { width: 100%; border-radius: 4px 4px 0 0; transition: opacity .15s; }

  &__tip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    white-space: nowrap;
    background: var(--ink);
    color: var(--bg);
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity .1s;
  }

  &__axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-weight: 700; }
}
</style>
