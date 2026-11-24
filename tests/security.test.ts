import type { IncomingMessage } from 'node:http'
import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import { isValidIban, shelterProfileSchema } from '#shared/models'
import { visitorGeo } from '../layers/core/server/utils/adAudience'
import { resolveClientIp } from '../layers/core/server/utils/clientIp'
import { isPushEndpoint } from '../layers/core/server/utils/pushEndpoint'

// Controlli di sicurezza senza server né database: IP di chi visita, servizi push, IBAN dei rifugi

function fakeEvent(headers: Record<string, string>, remoteAddress = '10.0.0.5') {
  const req = { headers, socket: { remoteAddress }, url: '/', method: 'GET' } as unknown as IncomingMessage
  return createEvent(req, {} as never)
}

describe('IP di chi visita', () => {
  it('senza proxy dichiarato ignora X-Forwarded-For (lo può scrivere chiunque)', () => {
    const event = fakeEvent({ 'x-forwarded-for': '1.2.3.4' })
    expect(resolveClientIp(event, {})).toBe('10.0.0.5')
  })

  it('con un proxy di fiducia prende la voce aggiunta dal proxy, non quelle inventate a sinistra', () => {
    const event = fakeEvent({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' })
    expect(resolveClientIp(event, { hops: 1 })).toBe('203.0.113.7')
    expect(resolveClientIp(event, { hops: 2 })).toBe('6.6.6.6')
  })

  it('con l\'header del proxy (Cloudflare) usa quello', () => {
    const event = fakeEvent({ 'cf-connecting-ip': '198.51.100.9', 'x-forwarded-for': '1.2.3.4' })
    expect(resolveClientIp(event, { header: 'CF-Connecting-IP' })).toBe('198.51.100.9')
  })

  it('se l\'header manca torna all\'indirizzo della connessione', () => {
    expect(resolveClientIp(fakeEvent({}), { header: 'cf-connecting-ip' })).toBe('10.0.0.5')
    expect(resolveClientIp(fakeEvent({}), { hops: 1 })).toBe('10.0.0.5')
  })
})

describe('indirizzi dei servizi push', () => {
  it('accetta i servizi dei browser', () => {
    expect(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
    expect(isPushEndpoint('https://web.push.apple.com/QGx')).toBe(true)
    expect(isPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=abc')).toBe(true)
  })

  it('rifiuta indirizzi interni, porte, http e domini che imitano quelli veri', () => {
    expect(isPushEndpoint('https://127.0.0.1:5432/x')).toBe(false)
    expect(isPushEndpoint('https://localhost/x')).toBe(false)
    expect(isPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false)
    expect(isPushEndpoint('https://fcm.googleapis.com:8443/x')).toBe(false)
    expect(isPushEndpoint('https://fcm.googleapis.com.evil.example/x')).toBe(false)
    expect(isPushEndpoint('https://evilnotify.windows.com/x')).toBe(false)
    expect(isPushEndpoint('https://user:pw@fcm.googleapis.com/x')).toBe(false)
    expect(isPushEndpoint('non un indirizzo')).toBe(false)
  })
})

describe('IBAN dei rifugi', () => {
  it('controlla le cifre di controllo', () => {
    expect(isValidIban('IT60X0542811101000000123456')).toBe(true)
    expect(isValidIban('DE89370400440532013000')).toBe(true)
    // Una cifra sbagliata
    expect(isValidIban('IT60X0542811101000000123457')).toBe(false)
    expect(isValidIban('IT60')).toBe(false)
  })

  it('accetta spazi e minuscole, poi li toglie', () => {
    const base = { description: 'Un rifugio di prova con una descrizione abbastanza lunga.', socials: {}, contactEmail: 'rifugio@example.test', lat: null, lng: null }
    const ok = shelterProfileSchema.safeParse({ ...base, iban: 'it60 x054 2811 1010 0000 0123 456' })
    expect(ok.success && ok.data.iban).toBe('IT60X0542811101000000123456')
    expect(shelterProfileSchema.safeParse({ ...base, iban: 'IT60 X054 2811 1010 0000 0123 457' }).success).toBe(false)
  })
})

describe('posizione di chi visita', () => {
  const headers = { 'cf-ipcountry': 'FR', 'cf-ipcity': 'Lyon', 'x-vercel-ip-country': 'DE' }

  it('senza rete dichiarata ignora gli header (li può inventare chiunque)', () => {
    expect(visitorGeo(fakeEvent(headers), '').country).not.toBe('FR')
  })

  it('legge solo gli header della rete dichiarata', () => {
    expect(visitorGeo(fakeEvent(headers), 'cloudflare')).toMatchObject({ country: 'FR', city: 'Lyon' })
    expect(visitorGeo(fakeEvent(headers), 'vercel').country).toBe('DE')
  })
})
