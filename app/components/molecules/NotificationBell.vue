<script setup lang="ts">
import type { NotificationList } from '#shared/models'

// Campanella degli avvisi: si ricarica a ogni cambio pagina, aprirla segna tutto come letto
const route = useRoute()
const data = ref<NotificationList | null>(null)
const open = ref(false)
const root = ref<HTMLElement>()

async function refresh() {
  try { data.value = await $fetch<NotificationList>('/api/notifications') }
  catch { /* senza avvisi la campanella resta com'era */ }
}

async function toggle() {
  open.value = !open.value
  if (!open.value || !data.value?.unread) return
  await $fetch('/api/notifications/read', { method: 'POST' }).catch(() => {})
  // Il pallino sparisce subito, gli avvisi restano evidenziati finché il pannello è aperto
  data.value.unread = 0
}

function close() {
  if (!open.value) return
  open.value = false
  data.value?.items.forEach(n => (n.read = true))
}

function onOutside(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) close()
}
const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && close()

onMounted(() => {
  refresh()
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('keydown', onEsc)
})
watch(() => route.path, () => {
  close()
  refresh()
})

const ago = timeAgo
</script>

<template>
  <div ref="root" class="notification-bell">
    <button
      type="button" class="notification-bell__ring" :aria-expanded="open" aria-haspopup="true"
      :aria-label="data?.unread ? $t('notif.unread', { n: data.unread }) : $t('notif.title')" @click="toggle"
    >
      <AppIcon name="bell" />
      <span v-if="data?.unread" class="notification-bell__count" aria-hidden="true">{{ data.unread > 9 ? '9+' : data.unread }}</span>
    </button>
    <Transition name="drop">
      <div v-if="open" class="notification-bell__panel" role="region" :aria-label="$t('notif.title')">
        <h2 class="notification-bell__title">{{ $t('notif.title') }}</h2>
        <ul v-if="data?.items.length" class="notification-bell__list">
          <li v-for="n in data.items" :key="n.id">
            <component
              :is="n.link ? resolveComponent('NuxtLink') : 'div'" :to="n.link ?? undefined"
              class="notification-bell__item" :class="{ 'notification-bell__item--new': !n.read, 'notification-bell__item--link': n.link }" @click="close"
            >
              <span class="notification-bell__emoji" aria-hidden="true">{{ n.emoji }}</span>
              <span class="notification-bell__text">{{ notificationText(n) }}<small class="notification-bell__time">{{ ago(n.createdAt) }}</small></span>
            </component>
          </li>
        </ul>
        <p v-else class="notification-bell__empty">{{ $t('notif.empty') }}</p>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: campanella con il pannello degli avvisi
.notification-bell {
  position: relative;
  flex-shrink: 0;

  &__ring {
    position: relative;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    display: grid;
    place-items: center;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 6px 14px -8px var(--shadow);

    .icon { width: 21px; height: 21px; }
  }

  &__count {
    position: absolute;
    top: -3px;
    right: -3px;
    min-width: 19px;
    height: 19px;
    padding: 0 5px;
    border-radius: $radius-pill;
    background: var(--heart);
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    line-height: 19px;
    text-align: center;
    box-shadow: 0 0 0 2px var(--bg);
    animation: wiggle .6s ease-in-out 2;

    @media (prefers-reduced-motion: reduce) { animation: none; }
  }

  &__panel {
    position: absolute;
    right: -52px;
    top: calc(100% + 10px);
    z-index: 20;
    width: min(360px, calc(100vw - 32px));
    max-height: min(70vh, 480px);
    overflow-y: auto;
    background: var(--surface);
    border-radius: $radius-lg;
    padding: 14px 8px 8px;
    box-shadow: 0 20px 40px -12px var(--shadow), 0 0 0 1px var(--line);

    @include mq(md) { right: 0; }
  }

  &__title { font-size: 17px; padding: 0 8px 8px; }

  &__list { list-style: none; margin: 0; padding: 0; @include stack(2px); }

  &__item {
    display: flex;
    gap: $space-4;
    align-items: flex-start;
    padding: 9px 8px;
    border-radius: $radius-sm;
    @include plain-link(var(--ink));

    &--link:hover { background: var(--bg); }

    &--new, &--new:hover { background: var(--coral-soft); }
  }

  &__emoji { font-size: 22px; line-height: 1.1; flex-shrink: 0; }

  &__text { font-size: 14px; font-weight: 700; line-height: 1.3; }

  &__time { display: block; font-weight: 600; color: var(--muted); font-size: 12px; margin-top: 2px; }

  &__empty { margin: 0; padding: 4px 8px 10px; color: var(--muted); font-size: 14px; }
}

@keyframes wiggle {
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}

.drop-enter-active, .drop-leave-active { transition: opacity .18s, transform .18s; }

.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
