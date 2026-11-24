<script setup lang="ts">
/**
 * Molecola: notifiche push su questo dispositivo. "compact" (nella campanella) si mostra solo
 * quando c'è qualcosa da fare: attivarle, o sull'iPhone aggiungere prima il sito alla schermata Home
 */
const props = defineProps<{ compact?: boolean }>()
const { state, busy, check, enable, disable, available } = usePush()
const error = ref('')
onMounted(check)

async function run(action: () => Promise<void>) {
  error.value = ''
  try {
    await action()
  }
  catch {
    error.value = 'push.failed'
  }
}

const visible = computed(() => available && (!props.compact || state.value === 'off' || state.value === 'ios-install'))
</script>

<template>
  <div v-if="visible" class="push-toggle" :class="{ 'push-toggle--compact': compact }">
    <p class="push-toggle__text">
      <template v-if="state === 'on'">✅ {{ $t('push.on') }}</template>
      <template v-else-if="state === 'denied'">{{ $t('push.denied') }}</template>
      <template v-else-if="state === 'ios-install'">{{ $t('push.iosInstall') }}</template>
      <template v-else-if="state === 'unsupported'">{{ $t('push.unsupported') }}</template>
      <template v-else>{{ $t('push.offer') }}</template>
    </p>
    <button v-if="state === 'off'" type="button" class="btn btn--primary push-toggle__btn" :disabled="busy" @click="run(enable)">🔔 {{ $t('push.enable') }}</button>
    <button v-else-if="state === 'on'" type="button" class="btn btn--ghost push-toggle__btn" :disabled="busy" @click="run(disable)">{{ $t('push.disable') }}</button>
    <p v-if="error" class="error" role="alert">{{ $t(error) }}</p>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: interruttore delle notifiche push
.push-toggle {
  @include stack($space-3);
  align-items: flex-start;

  &__text { margin: 0; color: var(--muted); line-height: 1.5; }

  &--compact {
    gap: $space-2;
    padding-top: $space-3;
    border-top: 1px solid var(--line);
    font-size: 14px;
  }
}
</style>
