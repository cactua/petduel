<script setup lang="ts">
// Rifiuta e Accetta hanno lo stesso peso: rifiutare deve essere facile quanto accettare
const { show, consent, choose } = useConsent()
</script>

<template>
  <!-- Fuori dal layout: sopra a tutto, comprese card e barra in basso -->
  <Teleport to="body">
    <Transition name="pop">
      <section v-if="show" class="consent-banner" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-text">
        <h2 id="consent-title" class="consent-banner__title">🍪 {{ $t('consent.title') }}</h2>
        <p id="consent-text" class="consent-banner__text">{{ $t('consent.text') }} <NuxtLink to="/cookie" class="consent-banner__link">{{ $t('consent.more') }}</NuxtLink></p>
        <p v-if="consent" class="consent-banner__text consent-banner__text--now">{{ $t(`consent.now.${consent}`) }}</p>
        <div class="consent-banner__actions">
          <button type="button" class="consent-banner__choice" @click="choose('none')">{{ $t('consent.reject') }}</button>
          <button type="button" class="consent-banner__choice" @click="choose('ads')">{{ $t('consent.accept') }}</button>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// Organismo: richiesta di consenso; "Rifiuta" e "Accetta" hanno lo stesso peso
.consent-banner {
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

  &__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;

    &--now { color: var(--muted); font-weight: 700; font-size: 13px; }
  }

  &__link { color: var(--coral-deep); font-weight: 800; }

  &__actions { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; margin-top: $space-1; }

  &__choice {
    border: 2px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
    @include pill(10px, 12px);
    font-weight: 900;
    font-size: 15px;
    cursor: pointer;

    &:last-child { background: var(--ink); color: var(--bg); }

    &:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
  }
}

.pop-enter-active, .pop-leave-active {
  transition: opacity .2s, transform .2s;

  @media (prefers-reduced-motion: reduce) { transition: none; }
}

.pop-enter-from, .pop-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>
