<script setup lang="ts">
import site from '#site'
// Template (Atomic Design): testata, contenuto della pagina e dock in basso su mobile
const { loggedIn, user } = useUserSession()
const { features } = useAppConfig()
const { t } = useI18n()
// Note legali sempre raggiungibili in fondo alla pagina (nei duelli, che stanno in uno schermo, sono nel menu)
const LEGAL = computed(() => [
  { to: '/rules', label: t('rules.link') },
  { to: '/privacy', label: t('legal.privacy') },
  { to: '/cookie', label: t('legal.cookie') },
  { to: '/terms', label: t('legal.terms') },
  { to: '/accessibility', label: t('legal.accessibility') },
  { to: '/advertise', label: t('advertise.link') },
])
</script>

<template>
  <div class="app-shell">
    <a href="#main" class="skip-link">{{ $t('nav.skip') }}</a>
    <header class="app-shell__header">
      <NuxtLink to="/" class="app-shell__logo"><SiteIcon />{{ site.name }}</NuxtLink>
      <nav class="app-shell__nav">
        <NuxtLink to="/challenges" class="app-shell__nav-link">{{ $t('nav.challenges') }}</NuxtLink>
        <NuxtLink to="/leaderboard" class="app-shell__nav-link">{{ $t('nav.ranking') }}</NuxtLink>
        <NuxtLink v-if="features.shelters" to="/shelters" class="app-shell__nav-link">{{ $t('nav.adopt') }}</NuxtLink>
      </nav>
      <!-- Nella barra restano le azioni principali; profilo, lingua, tema ed esci stanno nel menu -->
      <div class="app-shell__account">
        <NuxtLink v-if="loggedIn" to="/upload" class="btn btn--primary">+ {{ $t('nav.upload') }}</NuxtLink>
        <NuxtLink v-else to="/login" class="btn btn--primary">{{ $t('nav.login') }}</NuxtLink>
      </div>
      <!-- Qui una pagina può aggiungere un'informazione sua con <Teleport to="#header-extra"> (la home: i voti dati) -->
      <div id="header-extra" class="app-shell__extra" />
      <NotificationBell v-if="loggedIn" class="app-shell__notif" />
      <AccountMenu class="app-shell__menu" />
    </header>

    <main id="main" class="app-shell__main" tabindex="-1">
      <EmailVerifyBar />
      <slot />
    </main>

    <footer class="app-shell__footer">
      <nav :aria-label="$t('legal.title')">
        <ul class="app-shell__footer-links">
          <li v-for="l in LEGAL" :key="l.to"><NuxtLink :to="l.to" class="app-shell__footer-link">{{ l.label }}</NuxtLink></li>
        </ul>
      </nav>
      <p class="app-shell__footer-note">© {{ new Date().getFullYear() }} {{ site.name }}</p>
    </footer>

    <!-- I duelli sono la home e si raggiungono dal logo; l'admin si apre dal menu dell'account -->
    <nav class="app-shell__dock" :aria-label="$t('nav.sections')">
      <NuxtLink to="/challenges" class="app-shell__dock-link"><AppIcon name="flag" /><span>{{ $t('nav.challenges') }}</span></NuxtLink>
      <NuxtLink to="/leaderboard" class="app-shell__dock-link"><AppIcon name="podium" /><span>{{ $t('nav.ranking') }}</span></NuxtLink>
      <NuxtLink to="/upload" class="app-shell__dock-link app-shell__dock-link--big" :aria-label="$t('nav.uploadPhoto')"><AppIcon name="camera" /></NuxtLink>
      <NuxtLink v-if="features.shelters" to="/shelters" class="app-shell__dock-link"><AppIcon name="home" /><span>{{ $t('nav.adopt') }}</span></NuxtLink>
      <NuxtLink :to="loggedIn && user ? `/u/${user.username}` : '/login'" class="app-shell__dock-link">
        <span v-if="loggedIn && user" class="app-shell__dock-avatar" aria-hidden="true"><MyAvatar :letter="user.username.charAt(0).toUpperCase()" /></span>
        <AppIcon v-else name="login" /><span>{{ loggedIn ? $t('nav.profile') : $t('nav.login') }}</span>
      </NuxtLink>
    </nav>
    <ConsentBanner />
    <RulesPrompt />
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

  // Schermi larghi: un po' più di spazio, così le card dei duelli non diventano strisce alte e strette
  @media (min-width: 1280px) { max-width: 1200px; }

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

  // Spazio per la pagina: vuoto non occupa posto; pieno si prende il margine automatico al posto della campanella
  &__extra {
    display: flex;
    align-items: center;
    margin-left: auto;

    &:empty { display: none; }

    @include mq(md) { margin-left: -14px; }
  }

  &__extra:not(:empty) + &__notif,
  &__extra:not(:empty) + &__menu { margin-left: -18px; }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;

    // Ci arriva il "Vai al contenuto": nessun bordo intorno a tutta la pagina
    &:focus { outline: none; }
  }

  // Piè di pagina con le note legali; nei duelli (a schermo intero) le stesse voci sono nel menu dell'account
  &__footer {
    @include stack($space-2);
    align-items: center;
    padding: $space-7 0 $space-3;
    text-align: center;

    .app-shell:has(.u-fit-screen) & { display: none; }
  }

  &__footer-links {
    @include cluster($space-1);
    justify-content: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__footer-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 $space-4;
    @include plain-link(var(--muted));
    font-weight: 700;
    font-size: 14px;
    text-decoration: underline;
    text-underline-offset: 3px;

    &:hover { color: var(--ink); }
  }

  &__footer-note { margin: 0; color: var(--muted); font-size: 13px; font-weight: 700; }

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

    // Il proprio avatar al posto dell'icona del profilo
    .app-shell__dock-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: var(--action);
      color: #fff;
      font-family: var(--display);
      font-size: 12px;
      font-weight: 700;
    }

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
