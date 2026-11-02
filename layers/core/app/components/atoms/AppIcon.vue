<script setup lang="ts">
// Icone disegnate a mano per PetDuel: tratto arrotondato, colore dal testo
defineProps<{ name: 'paw' | 'flag' | 'podium' | 'camera' | 'face' | 'share' | 'login' | 'shield' | 'sun' | 'moon' | 'home' | 'bell' | 'auto' | 'heart' }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <g v-if="name === 'paw'" fill="currentColor" stroke="none">
      <ellipse cx="12" cy="15.5" rx="5" ry="4.2" /><circle cx="6" cy="9.5" r="2.2" /><circle cx="9.8" cy="6" r="2.2" />
      <circle cx="14.2" cy="6" r="2.2" /><circle cx="18" cy="9.5" r="2.2" />
    </g>
    <path v-else-if="name === 'heart'" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    <path v-else-if="name === 'flag'" d="M6 21V4m0 1h11l-2.5 4L17 13H6" />
    <path v-else-if="name === 'podium'" d="M9 20V8h6v12M3 20v-7h6M15 20v-5h6v5zM2 20h20" />
    <g v-else-if="name === 'camera'"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.4" /></g>
    <g v-else-if="name === 'face'">
      <path d="M5 10 3.5 4.5 9 7.5M19 10l1.5-5.5L15 7.5" /><circle cx="12" cy="13.5" r="7" />
      <circle cx="9.5" cy="12.5" r=".6" /><circle cx="14.5" cy="12.5" r=".6" />
    </g>
    <path v-else-if="name === 'share'" d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13v7h14v-7" />
    <path v-else-if="name === 'login'" d="M10 17l5-5-5-5M15 12H3M14 4h5v16h-5" />
    <path v-else-if="name === 'shield'" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4" />
    <g v-else-if="name === 'sun'"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g>
    <path v-else-if="name === 'home'" d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5" />
    <path v-else-if="name === 'bell'" d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
    <g v-else-if="name === 'auto'"><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></g>
    <path v-else-if="name === 'moon'" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
</template>

<style lang="scss" scoped>
// Atomo: icona a tratto, prende il colore del testo
.icon {
  width: 1.4em;
  height: 1.4em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
</style>
