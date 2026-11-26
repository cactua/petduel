<script setup lang="ts">
import { linkPlatform, withProtocol } from '../../utils/links'
// Atomo: bollino accanto a un link, con l'iniziale del sito riconosciuto (🔗 finché il link non è valido).
// Solo decorativo: il nome del sito lo dice il testo sotto il campo
const props = defineProps<{ url: string }>()
const platform = computed(() => linkPlatform(withProtocol(props.url)))
const mark = computed(() => platform.value ? (platform.value.known ? platform.value.name.slice(0, 2) : platform.value.name[0]!.toUpperCase()) : '')
</script>

<template>
  <span class="link-badge" :class="{ 'is-known': platform?.known, 'is-empty': !platform }" aria-hidden="true">
    <template v-if="platform">{{ mark }}</template>
    <svg v-else viewBox="0 0 24 24" class="link-badge__icon"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>
  </span>
</template>

<style lang="scss" scoped>
.link-badge {
  flex: none;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--bg);
  color: var(--muted);
  font-family: var(--display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -.02em;
  transition: background .15s, color .15s;

  &.is-known { background: var(--coral-soft); color: var(--link); }

  &__icon { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
}
</style>
