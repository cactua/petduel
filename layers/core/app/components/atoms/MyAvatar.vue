<script setup lang="ts">
// Il proprio avatar dentro un cerchio già disegnato dal genitore; senza avatar la lettera del nome
defineProps<{ letter: string }>()
const avatar = useMyAvatar()
</script>

<template>
  <picture v-if="avatar" class="my-avatar">
    <source v-for="s in avatar.sources" :key="s.type" v-bind="s">
    <img :src="avatar.src" alt="" class="my-avatar__img">
  </picture>
  <template v-else>{{ letter }}</template>
</template>

<style lang="scss" scoped>
.my-avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;

  &__img { width: 100%; height: 100%; object-fit: cover; display: block; }
}
</style>
