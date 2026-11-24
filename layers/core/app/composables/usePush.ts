// Notifiche push su questo dispositivo: stato, attivazione e spegnimento.
// Funzionano su Android e computer; su iPhone solo dopo "Aggiungi alla schermata Home" (iOS 16.4 o successivo)
export type PushState = 'unsupported' | 'ios-install' | 'off' | 'on' | 'denied'

const toKey = (base64: string) => {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export const registerServiceWorker = () =>
  navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)

export async function currentPushEndpoint() {
  if (!import.meta.client || !('serviceWorker' in navigator)) return undefined
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager?.getSubscription())?.endpoint
}

export function usePush() {
  const { vapidPublicKey } = useRuntimeConfig().public
  const { locale } = useI18n()
  const state = useState<PushState>('push-state', () => 'unsupported')
  const busy = ref(false)

  async function check() {
    if (!import.meta.client || !vapidPublicKey) return
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      state.value = ios && !standalone ? 'ios-install' : 'unsupported'
      return
    }
    if (Notification.permission === 'denied') {
      state.value = 'denied'
      return
    }
    state.value = (await currentPushEndpoint()) ? 'on' : 'off'
  }

  async function enable() {
    if (busy.value) return
    busy.value = true
    try {
      // Il permesso si chiede solo qui, dopo un tocco su "Attiva"
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        state.value = permission === 'denied' ? 'denied' : 'off'
        return
      }
      const reg = await registerServiceWorker()
      const sub = await reg.pushManager.getSubscription()
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(vapidPublicKey) })
      await $fetch('/api/me/push', { method: 'POST', body: { ...sub.toJSON(), locale: locale.value } })
      state.value = 'on'
    }
    finally {
      busy.value = false
    }
  }

  async function disable() {
    if (busy.value) return
    busy.value = true
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await $fetch('/api/me/push', { method: 'DELETE', body: { endpoint: sub.endpoint } }).catch(() => {})
        await sub.unsubscribe()
      }
      state.value = 'off'
    }
    finally {
      busy.value = false
    }
  }

  return { state, busy, check, enable, disable, available: !!vapidPublicKey }
}
