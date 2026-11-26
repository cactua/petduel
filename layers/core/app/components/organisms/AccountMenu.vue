<script setup lang="ts">
import { THEME_COOKIE, type ShelterManage } from '#shared/models'

/**
 * Menu dell'account in alto a destra: profilo, area rifugio, admin, lingua, tema ed esci.
 * Tiene in un posto solo quello che prima affollava la barra. Chi non ha l'account ci trova lingua, tema e accesso.
 */
const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { locale, locales, setLocale } = useI18n()
const { open: openConsent } = useConsent()
const route = useRoute()
const open = ref(false)
const root = ref<HTMLElement>()

// Tema: "system" segue il telefono; la scelta resta in un cookie, così il server manda già i colori giusti
type Theme = 'system' | 'light' | 'dark'
const themeCookie = useCookie<string | null>(THEME_COOKIE, { default: () => null, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
const theme = computed<Theme>({
  get: () => (themeCookie.value === 'light' || themeCookie.value === 'dark' ? themeCookie.value : 'system'),
  set: v => (themeCookie.value = v === 'system' ? null : v),
})
useHead({ htmlAttrs: { 'data-theme': () => (theme.value === 'system' ? undefined : theme.value) } })
const THEMES: { key: Theme, icon: 'sun' | 'moon' | 'auto' }[] = [{ key: 'system', icon: 'auto' }, { key: 'light', icon: 'sun' }, { key: 'dark', icon: 'moon' }]

// Accessibilità: interruttori che valgono su questo dispositivo (cookie, come il tema)
const { lessMotion, moreContrast, haptics } = useA11yPrefs()
const SWITCHES = [
  { key: 'motion', label: 'menu.lessMotion', on: lessMotion },
  { key: 'contrast', label: 'menu.moreContrast', on: moreContrast },
  { key: 'haptics', label: 'menu.haptics', on: haptics },
]

const { canInstall, install } = useInstallApp()

async function logout() {
  open.value = false
  // Chi esce non riceve più le notifiche push su questo dispositivo
  const endpoint = await currentPushEndpoint().catch(() => undefined)
  if (endpoint) await $fetch('/api/me/push', { method: 'DELETE', body: { endpoint } }).catch(() => {})
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/')
}

const close = () => (open.value = false)
function onOutside(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) close()
}
const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && close()
onMounted(() => {
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('keydown', onEsc)
})
watch(() => route.fullPath, close)

// Il proprio rifugio, con le richieste nuove: si chiede solo aprendo il menu, e solo sui siti con i rifugi
const { features } = useAppConfig()
const { data: myShelter, refresh: refreshShelter } = useLazyFetch<ShelterManage | null>('/api/shelters/me/summary', { server: false, immediate: false })
watch(open, (o) => {
  if (o && loggedIn.value && features.shelters) refreshShelter()
})

const initial = computed(() => user.value?.username.charAt(0).toUpperCase() ?? '')
</script>

<template>
  <div ref="root" class="account-menu">
    <button
      type="button" class="account-menu__trigger" :class="{ 'is-open': open }" :aria-expanded="open" aria-haspopup="true"
      :aria-label="$t('menu.open')" @click="open = !open"
    >
      <span v-if="loggedIn && user" class="account-menu__initial" aria-hidden="true"><MyAvatar :letter="initial" /></span>
      <AppIcon v-else name="face" />
    </button>

    <Transition name="drop">
      <div v-if="open" class="account-menu__panel" role="region" :aria-label="$t('menu.open')">
        <template v-if="loggedIn && user">
          <NuxtLink :to="`/u/${user.username}`" class="account-menu__who">
            <span class="account-menu__initial account-menu__initial--big" aria-hidden="true"><MyAvatar :letter="initial" /></span>
            <span><b class="account-menu__name">@{{ user.username }}</b><small class="account-menu__sub">{{ $t('menu.seeProfile') }}</small></span>
          </NuxtLink>
          <nav class="account-menu__links">
            <NuxtLink to="/upload" class="account-menu__link"><AppIcon name="camera" />{{ $t('nav.uploadPhoto') }}</NuxtLink>
            <NuxtLink to="/voted" class="account-menu__link"><AppIcon name="heart" />{{ $t('voted.title') }}</NuxtLink>
            <NuxtLink to="/favorites" class="account-menu__link"><AppIcon name="star" />{{ $t('favorites.title') }}</NuxtLink>
            <NuxtLink to="/following" class="account-menu__link"><AppIcon name="sparkle" />{{ $t('follow.title') }}</NuxtLink>
            <template v-if="features.shelters">
              <NuxtLink v-if="myShelter?.status === 'approved'" to="/my-shelter" class="account-menu__link">
                <AppIcon name="home" /><span class="account-menu__ellipsis">{{ myShelter.name }}</span>
                <em v-if="myShelter.newRequests" class="badge badge--action" :aria-label="$t('area.newCount', { n: myShelter.newRequests })">{{ myShelter.newRequests }}</em>
              </NuxtLink>
              <NuxtLink v-else to="/my-shelter" class="account-menu__link"><AppIcon name="home" />{{ myShelter?.status === 'pending' ? `${$t('menu.shelter')} · ${$t('area.pending')}` : $t('menu.becomeShelter') }}</NuxtLink>
            </template>
            <NuxtLink v-if="user.role === 'admin'" to="/admin" class="account-menu__link"><AppIcon name="shield" />{{ $t('profile.admin') }}</NuxtLink>
            <NuxtLink to="/account" class="account-menu__link"><AppIcon name="face" />{{ $t('account.title') }}</NuxtLink>
          </nav>
        </template>
        <div v-else class="account-menu__guest">
          <p class="account-menu__guest-text">{{ $t('menu.guest') }}</p>
          <div class="account-menu__guest-actions">
            <NuxtLink :to="{ path: '/login', query: { redirect: route.fullPath } }" class="btn btn--primary">{{ $t('nav.login') }}</NuxtLink>
            <NuxtLink :to="{ path: '/signup', query: { redirect: route.fullPath } }" class="btn btn--ghost">{{ $t('auth.register') }}</NuxtLink>
          </div>
        </div>

        <section class="account-menu__section">
          <h3 id="menu-lang" class="account-menu__heading">{{ $t('nav.language') }}</h3>
          <div class="account-menu__langs" role="radiogroup" aria-labelledby="menu-lang">
            <button
              v-for="l in locales" :key="l.code" type="button" role="radio" :aria-checked="locale === l.code" :lang="l.code"
              class="account-menu__option" :class="{ 'is-active': locale === l.code }" @click="setLocale(l.code)"
            >
              <b class="account-menu__code">{{ l.code.toUpperCase() }}</b>{{ l.name }}
            </button>
          </div>
        </section>

        <section class="account-menu__section">
          <h3 id="menu-theme" class="account-menu__heading">{{ $t('menu.theme') }}</h3>
          <div class="account-menu__themes" role="radiogroup" aria-labelledby="menu-theme">
            <button
              v-for="t in THEMES" :key="t.key" type="button" role="radio" :aria-checked="theme === t.key"
              class="account-menu__option account-menu__option--theme" :class="{ 'is-active': theme === t.key }" @click="theme = t.key"
            >
              <AppIcon :name="t.icon" />{{ $t(`menu.themes.${t.key}`) }}
            </button>
          </div>
        </section>

        <section class="account-menu__section">
          <h3 class="account-menu__heading">{{ $t('menu.a11y') }}</h3>
          <button
            v-for="s in SWITCHES" :key="s.key" type="button" role="switch" :aria-checked="s.on.value"
            class="account-menu__switch" @click="s.on.value = !s.on.value"
          >
            <span class="account-menu__switch-label">{{ $t(s.label) }}</span>
            <span class="account-menu__switch-track" aria-hidden="true"><span class="account-menu__switch-thumb" /></span>
          </button>
        </section>

        <nav class="account-menu__legal" :aria-label="$t('legal.title')">
          <NuxtLink to="/privacy" class="account-menu__legal-link" @click="close">{{ $t('legal.privacy') }}</NuxtLink>
          <NuxtLink to="/cookie" class="account-menu__legal-link" @click="close">{{ $t('legal.cookie') }}</NuxtLink>
          <NuxtLink to="/terms" class="account-menu__legal-link" @click="close">{{ $t('legal.terms') }}</NuxtLink>
          <NuxtLink to="/rules" class="account-menu__legal-link" @click="close">{{ $t('rules.link') }}</NuxtLink>
          <NuxtLink to="/accessibility" class="account-menu__legal-link" @click="close">{{ $t('legal.accessibility') }}</NuxtLink>
          <NuxtLink to="/advertise" class="account-menu__legal-link" @click="close">{{ $t('advertise.link') }}</NuxtLink>
        </nav>
        <!-- Solo dove il browser offre l'installazione (Chrome, Edge); su iPhone si usa Condividi → Aggiungi alla schermata Home -->
        <button v-if="canInstall" type="button" class="account-menu__link account-menu__link--footer" @click="close(); install()"><span class="account-menu__emoji" aria-hidden="true">📲</span>{{ $t('push.install') }}</button>
        <button type="button" class="account-menu__link account-menu__link--footer" @click="openConsent(); close()"><span class="account-menu__emoji" aria-hidden="true">🍪</span>{{ $t('consent.title') }}</button>
        <button v-if="loggedIn" type="button" class="account-menu__link account-menu__link--footer" @click="logout"><AppIcon name="login" />{{ $t('nav.logout') }}</button>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: menu dell'account (profilo, rifugio, lingua, tema, legale, esci)
.account-menu {
  position: relative;
  flex-shrink: 0;

  &__trigger {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    display: grid;
    place-items: center;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 6px 14px -8px var(--shadow);

    .icon { width: 22px; height: 22px; }

    &.is-open { box-shadow: 0 0 0 3px var(--coral-soft), 0 6px 14px -8px var(--shadow); }

    &:focus-visible { outline: 2px solid var(--coral); outline-offset: 2px; }
  }

  &__initial {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--action);
    color: #fff;
    font-family: var(--display);
    font-weight: 700;
    font-size: 18px;

    &--big { width: 44px; height: 44px; flex-shrink: 0; font-size: 21px; }
  }

  &__panel {
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    z-index: 20;
    width: min(320px, calc(100vw - 32px));
    max-height: calc(100dvh - 90px);
    overflow-y: auto;
    background: var(--surface);
    border-radius: $radius-lg;
    padding: $space-3;
    @include stack($space-1);
    box-shadow: 0 20px 40px -12px var(--shadow), 0 0 0 1px var(--line);
  }

  &__who {
    display: flex;
    align-items: center;
    gap: $space-5;
    padding: $space-3;
    border-radius: 16px;
    @include plain-link(var(--ink));

    &:hover { background: var(--bg); }
  }

  &__name { display: block; font-size: 16px; overflow: hidden; text-overflow: ellipsis; }

  &__sub { color: var(--muted); font-weight: 700; }

  &__links { display: flex; flex-direction: column; padding-bottom: $space-1; border-bottom: 1px solid var(--line); }

  &__link {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-4;
    border-radius: $radius-sm;
    @include plain-link(var(--ink));
    font-weight: 800;
    font-size: 15px;

    .icon { width: 20px; height: 20px; color: var(--muted); }

    &:hover { background: var(--bg); }

    &.router-link-active, &.router-link-active .icon { color: var(--coral); }

    // Bottoni in fondo (cookie, esci): a tutta larghezza, separati da una riga
    &--footer {
      width: 100%;
      border: 0;
      background: none;
      cursor: pointer;
      border-top: 1px solid var(--line);
      border-radius: 0 0 $radius-sm $radius-sm;
      color: var(--muted);
    }
  }

  &__ellipsis { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__emoji { width: 20px; text-align: center; }

  &__guest { @include stack($space-4); padding: 8px 8px 12px; border-bottom: 1px solid var(--line); }

  &__guest-text { margin: 0; color: var(--muted); font-size: 14px; }

  &__guest-actions { display: grid; grid-template-columns: 1fr 1fr; gap: $space-2; }

  &__section { @include stack($space-2); padding: $space-3; }

  &__heading { margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }

  &__langs { display: grid; grid-template-columns: 1fr 1fr; gap: $space-1; }

  &__themes { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-1; }

  &__option {
    display: flex;
    align-items: center;
    gap: $space-3;
    border: 0;
    cursor: pointer;
    text-align: left;
    padding: 8px 10px;
    border-radius: 12px;
    background: var(--bg);
    color: var(--ink);
    font-weight: 700;
    font-size: 14px;

    &:focus-visible { outline: 2px solid var(--coral); outline-offset: 1px; }

    &.is-active { background: var(--ink); color: var(--bg); }

    &--theme {
      flex-direction: column;
      gap: 3px;
      text-align: center;
      font-size: 12px;
      padding: 8px 4px;

      .icon { width: 20px; height: 20px; }
    }
  }

  &__code {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .04em;
    min-width: 26px;
    text-align: center;
    padding: 2px 0;
    border-radius: 6px;
    background: var(--surface);
    color: var(--muted);

    .is-active & { background: var(--coral); color: #fff; }
  }

  // Interruttore: tutta la riga si tocca, il cursore a destra mostra acceso/spento anche con la spunta
  &__switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 12px;
    background: var(--bg);
    color: var(--ink);
    font-weight: 700;
    font-size: 14px;
    text-align: left;
    cursor: pointer;

    &:focus-visible { outline: 2px solid var(--coral); outline-offset: 1px; }
  }

  &__switch-track {
    flex-shrink: 0;
    width: 44px;
    height: 26px;
    padding: 3px;
    border-radius: $radius-pill;
    background: var(--muted);
    display: flex;

    [aria-checked="true"] > & { background: var(--action); justify-content: flex-end; }
  }

  &__switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    display: grid;
    place-items: center;

    // Spunta quando è acceso: lo stato non dipende solo dal colore
    [aria-checked="true"] &::after { content: ""; width: 8px; height: 4px; border: solid var(--action); border-width: 0 0 2px 2px; transform: translateY(-1px) rotate(-45deg); }
  }

  &__legal { order: 99; display: flex; flex-wrap: wrap; gap: 4px 12px; padding: 8px 10px 4px; border-top: 1px solid var(--line); }

  &__legal-link {
    @include plain-link(var(--muted));
    font-size: 12px;
    font-weight: 800;
    // Area da toccare alta almeno 24px (WCAG 2.5.8)
    display: inline-block;
    padding: 5px 0;

    &:hover { color: var(--coral-deep); }
  }
}

.drop-enter-active, .drop-leave-active {
  transition: opacity .18s, transform .18s;

  @media (prefers-reduced-motion: reduce) { transition: none; }
}

.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
