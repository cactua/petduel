<script setup lang="ts">
import type { AdTargeting } from '#shared/models'

// Giorni della settimana e fascia oraria in cui la campagna esce (admin). Vuoto = sempre
const t = defineModel<AdTargeting>({ required: true })

const toggleDay = (d: number) => (t.value.days = t.value.days.includes(d) ? t.value.days.filter(x => x !== d) : [...t.value.days, d].sort())
const PRESETS = [
  { label: 'Tutti', days: [] as number[] },
  { label: 'Lun–Ven', days: [1, 2, 3, 4, 5] },
  { label: 'Weekend', days: [6, 7] },
]
const samePreset = (days: number[]) => days.length === t.value.days.length && days.every(d => t.value.days.includes(d))
const hoursOn = computed({
  get: () => !!t.value.hours,
  set: on => (t.value.hours = on ? { from: 9, to: 19 } : null),
})
</script>

<template>
  <div class="admin-form admin-form--tight ad-schedule">
    <div class="admin-form__group">
      <span class="admin-form__label">Giorni <em>nessuna scelta = tutti</em></span>
      <div class="ad-schedule__row">
        <div class="ad-schedule__days">
          <button
            v-for="(d, i) in DAY_NAMES" :key="d" type="button" class="ad-schedule__day" :class="{ 'is-active': t.days.includes(i + 1) }"
            :aria-pressed="t.days.includes(i + 1)" @click="toggleDay(i + 1)"
          >
            {{ d }}
          </button>
        </div>
        <div class="ad-schedule__presets">
          <button v-for="p in PRESETS" :key="p.label" type="button" class="ad-schedule__preset" :class="{ 'is-active': samePreset(p.days) }" @click="t.days = [...p.days]">{{ p.label }}</button>
        </div>
      </div>
    </div>
    <label class="admin-form__check"><input v-model="hoursOn" type="checkbox"> Solo in certe ore</label>
    <div v-if="t.hours" class="ad-schedule__hours">
      <label>Dalle
        <select v-model.number="t.hours.from">
          <option v-for="h in 24" :key="h" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
        </select>
      </label>
      <label>Alle
        <select v-model.number="t.hours.to">
          <option v-for="h in 24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}:00</option>
        </select>
      </label>
      <small class="admin-form__hint ad-schedule__note">Nell'ora locale di chi vota. Se «alle» viene prima di «dalle» la fascia passa la mezzanotte (es. 22–2).</small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: giorni e ore in cui una campagna può uscire
.ad-schedule {
  &__row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }

  &__days { @include cluster($space-1); }

  &__day {
    width: 44px;
    height: 40px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;

    &.is-active { border-color: var(--coral); background: color-mix(in srgb, var(--coral) 14%, var(--bg)); }
  }

  &__presets { display: flex; gap: $space-1; }

  &__preset {
    border: 0;
    background: none;
    color: var(--muted);
    font-weight: 800;
    font-size: 12px;
    @include pill(4px, 8px);
    cursor: pointer;

    &.is-active { background: var(--line); color: var(--ink); }
  }

  &__hours { display: grid; grid-template-columns: repeat(2, minmax(0, 140px)); gap: $space-4; align-items: end; }

  &__note { grid-column: 1 / -1; }
}
</style>
