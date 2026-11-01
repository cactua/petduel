<script setup lang="ts">
import site from '#site'
// Template (Atomic Design): testata, contenuto della pagina e dock in basso su mobile
const { loggedIn, user } = useUserSession()
const { features } = useAppConfig()
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <NuxtLink to="/" class="app-shell__logo"><AppIcon name="paw" />{{ site.name }}</NuxtLink>
      <nav class="app-shell__nav">
        <NuxtLink to="/sfide" class="app-shell__nav-link">{{ $t('nav.challenges') }}</NuxtLink>
        <NuxtLink to="/classifica" class="app-shell__nav-link">{{ $t('nav.ranking') }}</NuxtLink>
        <NuxtLink v-if="features.shelters" to="/rifugi" class="app-shell__nav-link">{{ $t('nav.adopt') }}</NuxtLink>
      </nav>
      <!-- Nella barra restano le azioni principali; profilo, lingua, tema ed esci stanno nel menu -->
      <div class="app-shell__account">
        <NuxtLink v-if="loggedIn" to="/carica" class="btn btn--primary">+ {{ $t('nav.upload') }}</NuxtLink>
        <NuxtLink v-else to="/accedi" class="btn btn--primary">{{ $t('nav.login') }}</NuxtLink>
      </div>
      <NotificationBell v-if="loggedIn" class="app-shell__notif" />
      <AccountMenu class="app-shell__menu" />
    </header>

    <main class="app-shell__main">
      <slot />
    </main>

    <!-- I duelli sono la home e si raggiungono dal logo; l'admin si apre dal menu dell'account -->
    <nav class="app-shell__dock" :aria-label="$t('nav.sections')">
      <NuxtLink to="/sfide" class="app-shell__dock-link"><AppIcon name="flag" /><span>{{ $t('nav.challenges') }}</span></NuxtLink>
      <NuxtLink to="/classifica" class="app-shell__dock-link"><AppIcon name="podium" /><span>{{ $t('nav.ranking') }}</span></NuxtLink>
      <NuxtLink to="/carica" class="app-shell__dock-link app-shell__dock-link--big" :aria-label="$t('nav.uploadPhoto')"><AppIcon name="camera" /></NuxtLink>
      <NuxtLink v-if="features.shelters" to="/rifugi" class="app-shell__dock-link"><AppIcon name="home" /><span>{{ $t('nav.adopt') }}</span></NuxtLink>
      <NuxtLink :to="loggedIn && user ? `/u/${user.username}` : '/accedi'" class="app-shell__dock-link">
        <AppIcon :name="loggedIn ? 'face' : 'login'" /><span>{{ loggedIn ? $t('nav.profile') : $t('nav.login') }}</span>
      </NuxtLink>
    </nav>
    <ConsentBanner />
  </div>
</template>

<style lang="scss" scoped>
.app-shell {
  min-height: 100dvh;
  max-width: 1040px;
  margin: 0 auto;
  @include stack($space-4);
  padding-top: max(12px, env(safe-area-inset-top));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));

  // Duelli: tutto deve stare in uno schermo, senza scorrere
  &:has(.u-fit-screen) {
    height: 100dvh;
    min-height: 0;

    .app-shell__main { min-height: 0; }
  }

  @include mq(md) { padding-bottom: max(12px, env(safe-area-inset-bottom)); }

  // Sopra il contenuto, così i menu a tendina non finiscono sotto le card dei duelli
  &__header { position: relative; z-index: $z-header; display: flex; align-items: center; gap: 28px; }

  &__logo {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--display);
    font-weight: 700;
    font-size: 25px;
    @include plain-link(var(--coral));

    :deep(.icon) { width: 26px; height: 26px; transform: rotate(-12deg); }
  }

  &__nav {
    display: none;
    gap: $space-2;

    @include mq(md) { display: flex; }
  }

  &__nav-link {
    @include plain-link(var(--muted));
    font-weight: 800;
    @include pill(7px, 14px);

    &.router-link-active { color: var(--ink); background: var(--surface); box-shadow: $shadow-flat; }
  }

  &__account {
    margin-left: auto;
    display: none;
    align-items: center;
    gap: $space-6;

    @include mq(md) { display: flex; }
  }

  // Campanella (solo con l'account) e menu a destra, vicini tra loro
  &__notif, &__menu {
    margin-left: auto;

    @include mq(md) { margin-left: -14px; }
  }

  &__notif + &__menu { margin-left: -20px; }

  &__main { flex: 1; display: flex; flex-direction: column; }

  // Barra in basso su mobile: un "dock" bianco che galleggia sul fondo
  &__dock {
    position: sticky;
    bottom: max(8px, env(safe-area-inset-bottom));
    z-index: $z-dock;
    margin-bottom: max(8px, env(safe-area-inset-bottom));
    margin-top: $space-7;
    display: grid;
    // Colonne uguali per quante voci ci sono (senza rifugi sono 4)
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 2px;
    padding: $space-2;
    background: var(--surface);
    border-radius: $radius-xl;
    box-shadow: 0 12px 24px -14px var(--shadow);

    @include mq(md) { display: none; }
  }

  &__dock-link {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 0 5px;
    border-radius: $radius-md;
    @include plain-link(var(--muted));
    font-weight: 800;
    font-size: 11px;

    span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    :deep(.icon) { width: 22px; height: 22px; }

    &.router-link-active { color: var(--coral); }

    // Al centro il pulsante tondo per caricare, che sporge dal dock
    &--big {
      padding: 0;
      overflow: visible;

      :deep(.icon) {
        width: 54px;
        height: 54px;
        margin-top: -28px;
        padding: 13px;
        border-radius: 50%;
        background: var(--action);
        color: #fff;
        box-shadow: 0 10px 18px -6px var(--glow), 0 0 0 5px var(--surface);
      }

      &.router-link-active :deep(.icon) { background: var(--coral-deep); }
    }
  }
}
</style>
