<script setup lang="ts">
// Simbolo di BikeDuel al posto della zampa del nucleo: una moto vista di lato, a tratto come le altre icone
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="5.5" cy="15.5" r="3.5" />
    <circle cx="18.5" cy="15.5" r="3.5" />
    <path d="M5.5 15.5 9 10h5.5l4 5.5M9 10 7.5 7H5.5M14.5 10l2-3.5h2.5M10 13.5h4" />
  </svg>
</template>

<style lang="scss" scoped>
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
