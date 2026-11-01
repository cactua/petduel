<script setup lang="ts">
import { SPECIES, type Species } from '#shared/models'

// Orecchie (o ciuffo, o cresta) della specie, appoggiate sopra la cornice della foto.
// Il genitore deve essere position: relative; la dimensione si regola con --ear.
const props = defineProps<{ species: Species }>()
const pair = computed(() => !['uccello', 'rettile'].includes(props.species))
</script>

<template>
  <span v-if="SPECIES.includes(species)" class="pet-ears" :class="`pet-ears--${species}`" aria-hidden="true">
    <template v-if="pair">
      <svg v-for="side in ['l', 'r']" :key="side" class="pet-ears__ear" :class="`pet-ears__ear--${side}`" :viewBox="species === 'cane' ? '0 0 46 70' : species === 'gatto' ? '0 0 52 46' : species === 'coniglio' ? '0 0 40 80' : '0 0 40 40'">
        <path v-if="species === 'cane'" d="M23 3C39 3 45 20 42 43c-2 17-11 24-20 24C11 67 4 57 4 40 4 18 9 3 23 3z" fill="#c99366" />
        <template v-else-if="species === 'gatto'">
          <path d="M4 44 18 6c2-4 6-5 9-1l22 36z" fill="#ffc2d1" />
          <path d="M15 38 22 15l13 22z" fill="#ff9fb6" />
        </template>
        <template v-else-if="species === 'coniglio'">
          <path d="M20 78C6 78 2 52 3 32 4 12 11 2 20 2s16 10 17 30c1 20-3 46-17 46z" fill="#f6e1ea" />
          <path d="M20 70c-6 0-9-20-8-36 1-14 4-24 8-24s7 10 8 24c1 16-2 36-8 36z" fill="#ffb3c8" />
        </template>
        <template v-else>
          <circle cx="20" cy="20" r="18" :fill="species === 'roditore' ? '#e8b98a' : '#d8c6b4'" />
          <circle cx="20" cy="21" r="10" fill="#ffc2c8" />
        </template>
      </svg>
    </template>
    <svg v-else-if="species === 'uccello'" class="pet-ears__crest" viewBox="0 0 50 50">
      <g fill="#8fd3a8"><ellipse cx="14" cy="34" rx="5.5" ry="14" transform="rotate(-32 14 34)" /><ellipse cx="36" cy="34" rx="5.5" ry="14" transform="rotate(32 36 34)" /><ellipse cx="25" cy="28" rx="6.5" ry="19" /></g>
    </svg>
    <svg v-else class="pet-ears__crest" viewBox="0 0 80 30">
      <path d="M2 30 12 6l10 24 9-28 9 28 9-28 9 28 10-24 10 24z" fill="#9fd68a" />
    </svg>
  </span>
</template>

<style lang="scss" scoped>
// Atomo: orecchie della specie sopra la cornice. --ear regola la misura
.pet-ears {
  --s: var(--ear, 46px);
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;

  &__ear, &__crest { position: absolute; }

  &__ear--r { transform: scaleX(-1); }

  &--cane &__ear { top: calc(var(--s) * -.22); width: var(--s); height: calc(var(--s) * 1.52); }
  &--cane &__ear--l { left: calc(var(--s) * -.28); transform: rotate(14deg); }
  &--cane &__ear--r { right: calc(var(--s) * -.28); transform: rotate(-14deg) scaleX(-1); }

  &--gatto &__ear { top: calc(var(--s) * -.66); width: calc(var(--s) * 1.12); height: var(--s); }
  &--gatto &__ear--l { left: calc(var(--s) * .5); transform: rotate(-12deg); animation: twitch 4.5s ease-in-out infinite; }
  &--gatto &__ear--r { right: calc(var(--s) * .5); transform: rotate(12deg) scaleX(-1); }

  &--coniglio &__ear { top: calc(var(--s) * -1.3); width: calc(var(--s) * .8); height: calc(var(--s) * 1.6); transform-origin: 50% 100%; }
  &--coniglio &__ear--l { left: calc(var(--s) * .8); transform: rotate(-10deg); }
  &--coniglio &__ear--r { right: calc(var(--s) * .8); transform: rotate(12deg) scaleX(-1); }

  &--roditore &__ear, &--altro &__ear { top: calc(var(--s) * -.4); width: calc(var(--s) * .78); height: calc(var(--s) * .78); }
  &--roditore &__ear--l, &--altro &__ear--l { left: calc(var(--s) * .45); }
  &--roditore &__ear--r, &--altro &__ear--r { right: calc(var(--s) * .45); }

  &--uccello &__crest { top: calc(var(--s) * -.86); left: 50%; width: var(--s); height: var(--s); margin-left: calc(var(--s) * -.5); }
  &--rettile &__crest { top: calc(var(--s) * -.5); left: 50%; width: calc(var(--s) * 1.7); height: calc(var(--s) * .62); margin-left: calc(var(--s) * -.85); }

  // Il gatto ogni tanto muove un orecchio
  @media (prefers-reduced-motion: reduce) {
    &--gatto &__ear--l { animation: none; }
  }
}

@keyframes twitch {
  0%, 86%, 100% { transform: rotate(-12deg); }
  90% { transform: rotate(-26deg); }
  94% { transform: rotate(-6deg); }
}
</style>
