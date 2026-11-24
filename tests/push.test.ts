import { describe, expect, it } from 'vitest'
import webpush from 'web-push'
import { REJECT_REASONS } from '#shared/models'
import { notificationPushText, serverT } from '../layers/core/server/utils/pushText'

// Testi delle notifiche push: il server li scrive nella lingua di chi le riceve
describe('testi delle notifiche push', () => {
  it('sostituisce i parametri e sceglie la lingua', () => {
    const n = { text: 'notif.photoApproved', params: JSON.stringify({ name: 'Fido' }) }
    expect(notificationPushText(n, 'it')).toBe('La foto di Fido è stata approvata')
    expect(notificationPushText(n, 'en')).toContain('Fido')
    expect(notificationPushText(n, 'en')).not.toBe(notificationPushText(n, 'it'))
  })

  it('usa singolare e plurale secondo n', () => {
    const one = notificationPushText({ text: 'notif.weeklyHearts', params: JSON.stringify({ n: 1, name: 'Fido' }) }, 'it')
    const many = notificationPushText({ text: 'notif.weeklyHearts', params: JSON.stringify({ n: 5, name: 'Fido' }) }, 'it')
    expect(one).toContain('1 cuore.')
    expect(many).toContain('5 cuori.')
    expect(many).not.toContain(' | ')
  })

  it('usa il titolo tradotto della sfida e traduce il motivo di rifiuto', () => {
    const text = notificationPushText({
      text: 'notif.challengeWon',
      params: JSON.stringify({ name: 'Fido', challenge: 'Il più festivo', challenge_en: 'The most festive' }),
    }, 'en')
    expect(text).toContain('The most festive')
    const rejected = notificationPushText({ text: 'notif.photoRejected', params: JSON.stringify({ name: 'Fido', reason: REJECT_REASONS[0] }) }, 'de')
    expect(rejected).not.toContain(REJECT_REASONS[0])
  })

  it('risolve i testi collegati e i caratteri letterali', () => {
    expect(serverT('it', 'notif.followNew', { user: 'anna' })).toBe('Novità da @anna: dai un\'occhiata')
    expect(serverT('it', 'ad.thanks')).not.toContain('@:')
  })

  it('lascia com\'è un avviso vecchio senza parametri', () => {
    expect(notificationPushText({ text: 'Testo già scritto', params: null }, 'en')).toBe('Testo già scritto')
  })
})

describe('cifratura del messaggio push', () => {
  it('prepara una richiesta firmata (VAPID) per il servizio push', async () => {
    const vapid = webpush.generateVAPIDKeys()
    // Chiavi di un browser finto: servono solo a cifrare
    const { createECDH, randomBytes } = await import('node:crypto')
    const ecdh = createECDH('prime256v1')
    ecdh.generateKeys()
    const sub = { endpoint: 'https://push.example.test/abc', keys: { p256dh: ecdh.getPublicKey('base64url'), auth: randomBytes(16).toString('base64url') } }
    const req = webpush.generateRequestDetails(sub, JSON.stringify({ title: 'PetDuel', body: 'ciao' }), {
      vapidDetails: { subject: 'mailto:admin@example.test', publicKey: vapid.publicKey, privateKey: vapid.privateKey },
      TTL: 60,
    })
    expect(req.endpoint).toBe(sub.endpoint)
    expect(req.headers.Authorization).toMatch(/^vapid t=/)
    expect(req.headers['Content-Encoding']).toBe('aes128gcm')
    expect(req.body?.length).toBeGreaterThan(0)
  })
})
