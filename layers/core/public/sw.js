// Service worker: rende il sito installabile come app e mostra le notifiche push anche a sito chiuso.
// Niente cache delle pagine: i duelli cambiano a ogni voto e devono arrivare sempre freschi dal server
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  }
  catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(self.registration.showNotification(data.title || '', {
    body: data.body || '',
    icon: '/icon/192.png',
    badge: '/icon/badge-96.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  }))
})

// Tocco sulla notifica: si apre la pagina giusta, riusando una finestra del sito se c'è già
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin)
  if (url.origin !== self.location.origin) return
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of windows) {
      if (new URL(w.url).origin === url.origin && 'focus' in w) {
        await w.focus()
        if ('navigate' in w) await w.navigate(url.href)
        return
      }
    }
    await self.clients.openWindow(url.href)
  })())
})
