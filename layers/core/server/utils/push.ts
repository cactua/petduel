import { eq, inArray } from 'drizzle-orm'
import webpush from 'web-push'
import site from '#site'
import { pushSubscriptions } from '../db/schema'
import { useDb } from './db'
import { notificationPushText } from './pushText'

// Notifiche push: arrivano sul telefono o sul computer anche a sito chiuso.
// Si attivano solo se nel file .env ci sono le chiavi VAPID (vedi nuxt.config.ts)

export function pushConfigured() {
  const c = useRuntimeConfig()
  return !!(c.public.vapidPublicKey && c.vapidPrivateKey && c.vapidSubject)
}

/** Manda un avviso appena creato a tutti i dispositivi dell'utente; quelli scaduti si tolgono */
export async function sendPush(userId: number, n: { emoji: string, text: string, params: string | null, link: string | null, key: string }) {
  if (!pushConfigured()) return
  const db = await useDb()
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (!subs.length) return

  const c = useRuntimeConfig()
  const gone: number[] = []
  await Promise.all(subs.map(async (s) => {
    const payload = JSON.stringify({
      title: site.name,
      body: `${n.emoji} ${notificationPushText(n, s.locale)}`,
      url: n.link || '/',
      // Lo stesso avviso non si ripete se arriva due volte
      tag: n.key,
    })
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
        vapidDetails: { subject: c.vapidSubject, publicKey: c.public.vapidPublicKey, privateKey: c.vapidPrivateKey },
        TTL: 60 * 60 * 24,
      })
    }
    catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      // 404/410: il browser ha tolto il permesso o l'iscrizione non esiste più
      if (status === 404 || status === 410) gone.push(s.id)
      else console.error('[push] invio non riuscito', status ?? e)
    }
  }))
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone))
}
