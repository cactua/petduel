<script setup lang="ts">
// Chi si era iscritto prima delle regole le trova qui una volta; non copre la richiesta dei cookie né la pagina delle regole
const { user, fetch: refreshSession } = useUserSession()
const { show: consentOpen } = useConsent()
const route = useRoute()
const sending = ref(false)
const show = computed(() => !!user.value?.needsRules && !consentOpen.value && route.path !== '/rules')

async function accept() {
  sending.value = true
  try {
    await $fetch('/api/me/rules', { method: 'POST' })
    await refreshSession()
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <section v-if="show" class="rules-prompt" role="dialog" aria-labelledby="rules-prompt-title">
        <h2 id="rules-prompt-title" class="rules-prompt__title">💛 {{ $t('rules.promptTitle') }}</h2>
        <p class="rules-prompt__text">{{ $t('rules.promptText') }} <NuxtLink to="/rules" class="rules-prompt__link">{{ $t('rules.link') }}</NuxtLink></p>
        <button type="button" class="btn btn--primary" :disabled="sending" @click="accept">{{ $t('rules.promptAccept') }}</button>
      </section>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// Organismo: richiesta una tantum di accettare le regole, stesso posto e stessa forma del banner dei cookie
.rules-prompt {
  position: fixed;
  z-index: 50;
  left: 50%;
  transform: translateX(-50%);
  bottom: max(12px, env(safe-area-inset-bottom));
  width: min(560px, calc(100vw - 24px));
  background: var(--surface);
  color: var(--ink);
  border-radius: 24px;
  padding: 16px 18px;
  box-shadow: 0 20px 44px -14px var(--shadow), 0 0 0 1px var(--line);
  @include stack($space-3);

  &__title { margin: 0; font-size: 19px; }

  &__text { margin: 0; font-size: 14px; line-height: 1.45; }

  &__link { color: var(--coral-deep); font-weight: 800; }
}

.pop-enter-active, .pop-leave-active {
  transition: opacity .2s, transform .2s;

  @media (prefers-reduced-motion: reduce) { transition: none; }
}

.pop-enter-from, .pop-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>
