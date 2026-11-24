// Il service worker si registra a ogni visita (serve per installare il sito come app).
// Se le notifiche push sono attive, la lingua scelta segue quella del sito
export default defineNuxtPlugin((nuxtApp) => {
  listenForInstall()
  if (!('serviceWorker' in navigator)) return
  const start = () => registerServiceWorker().catch(() => {})
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  const { loggedIn } = useUserSession()
  const i18n = nuxtApp.$i18n as { locale: Ref<string> }
  watch(i18n.locale, async (locale) => {
    if (!loggedIn.value || !('PushManager' in window)) return
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await $fetch('/api/me/push', { method: 'POST', body: { ...sub.toJSON(), locale } }).catch(() => {})
  })
})
