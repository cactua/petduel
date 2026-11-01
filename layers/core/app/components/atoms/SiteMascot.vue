<script setup lang="ts">
// Biscotto, la mascotte di PetDuel: fa le domande e consola quando non c'è niente da vedere.
// Un sito può avere la sua (o nessuna): un SiteMascot.vue in sites/<nome>/app/components, e lo stesso disegno in brand.mascotSvg del site.config.ts per le card
defineProps<{ still?: boolean }>()
</script>

<template>
  <svg class="mascot" :class="{ 'mascot--still': still }" viewBox="0 0 84 76" aria-hidden="true">
    <ellipse cx="15" cy="34" rx="11" ry="20" fill="#b9814f" transform="rotate(20 15 34)" />
    <ellipse cx="69" cy="34" rx="11" ry="20" fill="#b9814f" transform="rotate(-20 69 34)" />
    <ellipse cx="42" cy="42" rx="28" ry="26" fill="#f6d7ae" />
    <ellipse cx="54" cy="35" rx="9" ry="8" fill="#e8b98a" />
    <circle cx="32" cy="40" r="4.2" fill="#3d2416" /><circle cx="52" cy="40" r="4.2" fill="#3d2416" />
    <circle cx="33.4" cy="38.5" r="1.4" fill="#fff" /><circle cx="53.4" cy="38.5" r="1.4" fill="#fff" />
    <ellipse cx="42" cy="50" rx="5" ry="3.6" fill="#3d2416" />
    <path d="M35 55q7 6 14 0" fill="none" stroke="#3d2416" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="42" cy="60" rx="3.6" ry="4.6" fill="#ff7b8a" />
    <ellipse cx="25" cy="51" rx="5" ry="3" fill="#ffb3b3" opacity=".75" /><ellipse cx="59" cy="51" rx="5" ry="3" fill="#ffb3b3" opacity=".75" />
    <ellipse cx="28" cy="72" rx="9" ry="5" fill="#f6d7ae" /><ellipse cx="56" cy="72" rx="9" ry="5" fill="#f6d7ae" />
  </svg>
</template>

<style lang="scss" scoped>
// Atomo: Biscotto, la mascotte, che dondola la testa
.mascot {
  width: 64px;
  height: 58px;
  flex-shrink: 0;
  transform-origin: 50% 100%;
  animation: tilt 3s ease-in-out infinite;

  &--still { animation: none; }

  @media (prefers-reduced-motion: reduce) { animation: none; }
}

@keyframes tilt {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(5deg); }
}
</style>
