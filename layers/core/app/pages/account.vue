<script setup lang="ts">
import { HAS_ARTISTS } from '#shared/models'

/**
 * Il proprio account, in sezioni con un indice che resta in alto: profilo (con anteprima e, dove c'è, il
 * profilo da artista), notifiche, sicurezza, privacy e dati, eliminazione. Le ancore #bio, #artist e
 * #two-factor portano dritte al punto (le usano il profilo e gli avvisi)
 */
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead({ title: () => `${t('account.title')}` })

const { user, clear } = useUserSession()
const { open: openConsent } = useConsent()

const { data: blocked, refresh: refreshBlocked } = await useFetch<string[]>('/api/me/blocks')
async function unblock(username: string) {
  await $fetch(`/api/users/${username}/block`, { method: 'POST', body: { blocked: false } })
  await refreshBlocked()
}

// --- Indice: la voce della sezione che si sta leggendo resta evidenziata ---
const sections = computed(() => [
  { id: 'bio', label: t('account.sections.profile') },
  ...(HAS_ARTISTS ? [{ id: 'artist', label: t('account.sections.artist') }] : []),
  { id: 'notifications', label: t('account.sections.notifications') },
  { id: 'security', label: t('account.sections.security') },
  { id: 'privacy', label: t('account.sections.privacy') },
  { id: 'delete', label: t('account.sections.delete') },
])
const active = ref('bio')
const profileDirty = ref(false)
const navRow = ref<HTMLElement | null>(null)
let frame = 0
function track() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const line = 140
    let current = sections.value[0]!.id
    for (const s of sections.value) {
      const el = document.getElementById(s.id)
      if (el && el.getBoundingClientRect().top <= line) current = s.id
    }
    // In fondo alla pagina l'ultima sezione può non arrivare in alto: vale lei
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = sections.value.at(-1)!.id
    active.value = current
  })
}
// La voce attiva resta visibile nella fila che scorre di lato (telefoni)
watch(active, (id) => {
  const row = navRow.value
  const link = row?.querySelector<HTMLElement>(`[data-section="${id}"]`)
  if (row && link) row.scrollTo({ left: link.offsetLeft - row.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' })
})
onMounted(() => {
  addEventListener('scroll', track, { passive: true })
  track()
})
onBeforeUnmount(() => {
  removeEventListener('scroll', track)
  cancelAnimationFrame(frame)
})

// Toccando una voce la sezione arriva in alto e prende il fuoco: chi usa la tastiera o un lettore di schermo riparte da lì
function go(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
  history.replaceState(history.state, '', `#${id}`)
  active.value = id
}

// --- Eliminazione dell'account ---
const confirming = ref(false)
const password = ref('')
const understood = ref(false)
const deleting = ref(false)
const error = ref('')

function cancelDelete() {
  confirming.value = false
  password.value = ''
  understood.value = false
  error.value = ''
}

async function remove() {
  error.value = ''
  deleting.value = true
  try {
    await $fetch('/api/me', { method: 'DELETE', body: { password: password.value } })
    await clear()
    await navigateTo('/')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="account-page">
    <header class="account-page__header">
      <div class="account-page__heading">
        <h1 class="account-page__title">{{ $t('account.title') }}</h1>
        <p class="account-page__user">@{{ user?.username }}</p>
      </div>
      <NuxtLink v-if="user" :to="`/u/${user.username}`" class="btn btn--ghost account-page__view">{{ $t('account.viewProfile') }}</NuxtLink>
    </header>

    <!-- Indice: resta in alto mentre si scorre; sui telefoni è una fila che scorre di lato -->
    <nav class="account-page__nav" :aria-label="$t('account.nav')">
      <ul ref="navRow" class="account-page__nav-row">
        <li v-for="s in sections" :key="s.id">
          <a
            :href="`#${s.id}`" :data-section="s.id" class="account-page__nav-link" :class="{ 'is-sub': s.id === 'artist' }"
            :aria-current="active === s.id ? 'location' : undefined" @click.prevent="go(s.id)"
          >
            {{ s.label }}
            <template v-if="s.id === 'bio' && profileDirty">
              <span class="account-page__nav-dot" aria-hidden="true" /><span class="u-visually-hidden">{{ $t('account.unsavedNote') }}</span>
            </template>
          </a>
        </li>
      </ul>
    </nav>

    <section id="bio" class="account-page__section" tabindex="-1" aria-labelledby="sec-profile">
      <h2 id="sec-profile" class="account-page__section-title">{{ $t('account.sections.profile') }}</h2>
      <ProfileEditor v-model:dirty="profileDirty" />
    </section>

    <section id="notifications" class="account-page__section" tabindex="-1" aria-labelledby="sec-notifications">
      <h2 id="sec-notifications" class="account-page__section-title">{{ $t('account.sections.notifications') }}</h2>
      <article class="account-page__card" aria-labelledby="card-push">
        <h3 id="card-push" class="account-page__card-title">🔔 {{ $t('push.title') }}</h3>
        <PushToggle />
      </article>
    </section>

    <section id="security" class="account-page__section" tabindex="-1" aria-labelledby="sec-security">
      <h2 id="sec-security" class="account-page__section-title">{{ $t('account.sections.security') }}</h2>
      <div class="account-page__pair">
        <article class="account-page__card" aria-labelledby="card-password">
          <h3 id="card-password" class="account-page__card-title">🔒 {{ $t('account.securityTitle') }}</h3>
          <AccountSecurity />
        </article>
        <article id="two-factor" class="account-page__card" tabindex="-1" aria-labelledby="card-totp">
          <h3 id="card-totp" class="account-page__card-title">🔐 {{ $t('totp.title') }}</h3>
          <TwoFactorSettings />
        </article>
      </div>
    </section>

    <section id="privacy" class="account-page__section" tabindex="-1" aria-labelledby="sec-privacy">
      <h2 id="sec-privacy" class="account-page__section-title">{{ $t('account.sections.privacy') }}</h2>
      <article v-if="blocked?.length" class="account-page__card" aria-labelledby="card-blocked">
        <h3 id="card-blocked" class="account-page__card-title">🚫 {{ $t('block.listTitle') }}</h3>
        <p class="account-page__text">{{ $t('block.listText') }}</p>
        <ul class="account-page__blocked">
          <li v-for="name in blocked" :key="name" class="account-page__blocked-row">
            <NuxtLink :to="`/u/${name}`" class="account-page__link">@{{ name }}</NuxtLink>
            <button type="button" class="btn btn--ghost" :aria-label="`${$t('block.unblock')} @${name}`" @click="unblock(name)">{{ $t('block.unblock') }}</button>
          </li>
        </ul>
      </article>

      <div class="account-page__pair">
        <article class="account-page__card" aria-labelledby="card-export">
          <h3 id="card-export" class="account-page__card-title">📦 {{ $t('account.exportTitle') }}</h3>
          <p class="account-page__text">{{ $t('account.exportText') }}</p>
          <!-- Link normale: il server risponde con un file da salvare -->
          <a href="/api/me/export" class="btn btn--ghost account-page__action" download>{{ $t('account.exportButton') }}</a>
        </article>

        <article class="account-page__card" aria-labelledby="card-consent">
          <h3 id="card-consent" class="account-page__card-title">🍪 {{ $t('consent.title') }}</h3>
          <p class="account-page__text">{{ $t('account.consentText') }}</p>
          <button type="button" class="btn btn--ghost account-page__action" @click="openConsent">{{ $t('account.consentButton') }}</button>
        </article>
      </div>
    </section>

    <section id="delete" class="account-page__section" tabindex="-1" aria-labelledby="sec-delete">
      <h2 id="sec-delete" class="account-page__section-title u-visually-hidden">{{ $t('account.sections.delete') }}</h2>
      <article class="account-page__card account-page__card--danger" aria-labelledby="card-delete">
        <h3 id="card-delete" class="account-page__card-title">{{ $t('account.deleteTitle') }}</h3>
        <p class="account-page__text">{{ $t('account.deleteText') }}</p>
        <button v-if="!confirming" type="button" class="account-page__delete account-page__action" @click="confirming = true">{{ $t('account.deleteButton') }}</button>
        <form v-else class="account-page__confirm" @submit.prevent="remove">
          <label for="del-pass" class="label">{{ $t('account.passwordLabel') }}</label>
          <input id="del-pass" v-model="password" type="password" autocomplete="current-password" required class="input account-page__input">
          <label class="account-page__check"><input v-model="understood" type="checkbox" class="account-page__checkbox"> {{ $t('account.understood') }}</label>
          <p v-if="error" class="account-page__error" role="alert">{{ error }}</p>
          <div class="account-page__buttons">
            <button type="button" class="btn btn--ghost" @click="cancelDelete">{{ $t('common.cancel') }}</button>
            <button type="submit" class="account-page__delete" :disabled="!password || !understood || deleting">
              {{ deleting ? $t('auth.wait') : $t('account.deleteConfirm') }}
            </button>
          </div>
        </form>
      </article>
    </section>

    <p class="account-page__links">
      <NuxtLink to="/privacy" class="account-page__link">{{ $t('legal.privacy') }}</NuxtLink> ·
      <NuxtLink to="/cookie" class="account-page__link">{{ $t('legal.cookie') }}</NuxtLink> ·
      <NuxtLink to="/terms" class="account-page__link">{{ $t('legal.terms') }}</NuxtLink> ·
      <NuxtLink to="/rules" class="account-page__link">{{ $t('rules.link') }}</NuxtLink>
    </p>
  </section>
</template>

<style lang="scss" scoped>
// Pagina: impostazioni dell'account in sezioni, con indice in alto
.account-page {
  width: 100%;
  @include stack($space-7);

  &__header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: $space-4; }

  &__heading { min-width: 0; }

  &__title { margin: 0; font-family: var(--display); font-size: clamp(26px, 5vw, 34px); }

  &__user { margin: 2px 0 0; color: var(--muted); font-weight: 800; overflow-wrap: anywhere; }

  &__view { min-height: 44px; }

  // Indice fisso in alto: sfondo pieno, così il contenuto ci scorre sotto senza confondersi
  &__nav {
    position: sticky;
    top: 0;
    z-index: $z-dock + 1;
    margin: 0 -16px;
    padding: 8px 16px;
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 2px solid var(--line);
  }

  &__nav-row {
    @include scroll-row;
    display: flex;
    gap: $space-2;
    margin: 0;
    padding: 2px;
    list-style: none;
    scroll-padding-inline: 16px;
  }

  &__nav-link {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    min-height: 44px;
    padding: 0 14px;
    border-radius: $radius-pill;
    white-space: nowrap;
    font-weight: 800;
    font-size: 14px;
    @include plain-link(var(--muted));

    &:hover { color: var(--ink); background: var(--surface); }

    &[aria-current] { color: var(--ink); background: var(--surface); box-shadow: inset 0 0 0 2px var(--action); }

    &:focus-visible { outline: 3px solid var(--ink); outline-offset: 1px; }
  }

  &__nav-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--action); }

  // Ogni sezione si ferma sotto l'indice quando ci si arriva
  &__section {
    @include stack($space-6);
    scroll-margin-top: 76px;

    &:focus { outline: none; }
  }

  &__section-title { @include eyebrow(13px); margin: $space-4 0 0; color: var(--muted); }

  &__card {
    @include card(18px 20px, 24px);
    @include stack($space-4);
    width: 100%;
    scroll-margin-top: 76px;

    &:focus { outline: none; }

    &--danger { box-shadow: 0 0 0 2px color-mix(in srgb, var(--coral) 40%, transparent), $shadow-card; }
  }

  &__pair { display: grid; gap: $space-6; @include mq(md) { grid-template-columns: 1fr 1fr; } }

  &__card-title {
    margin: 0;
    font-family: var(--display);
    font-size: 20px;

    .account-page__card--danger & { color: var(--link); }
  }

  &__text { margin: 0; line-height: 1.5; max-width: 75ch; }

  &__action { align-self: flex-start; margin-top: auto; }

  &__input { max-width: 360px; border-color: color-mix(in srgb, var(--muted) 70%, var(--line)); }

  &__error { margin: 0; color: var(--link); font-weight: 800; }

  &__delete {
    border: 0;
    @include pill(11px, 18px);
    min-height: 44px;
    font-weight: 900;
    font-size: 15px;
    cursor: pointer;
    background: var(--action);
    color: #fff;

    &:disabled { opacity: .5; cursor: not-allowed; }
  }

  &__confirm { @include stack($space-3); }

  &__check { display: flex; gap: $space-3; align-items: flex-start; font-weight: 700; font-size: 14px; line-height: 1.4; cursor: pointer; }

  &__checkbox { margin-top: 1px; width: 20px; height: 20px; flex: none; accent-color: var(--action); }

  &__buttons { @include cluster($space-3); }

  &__blocked { @include stack($space-2); margin: 0; padding: 0; list-style: none; }

  &__blocked-row { display: flex; justify-content: space-between; align-items: center; gap: $space-3; }

  &__links { text-align: center; color: var(--muted); font-size: 13px; }

  &__link { color: var(--muted); font-weight: 800; }
}
</style>
