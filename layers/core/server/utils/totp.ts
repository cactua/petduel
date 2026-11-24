import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// Verifica in due passaggi con le app di autenticazione (TOTP, RFC 6238): codice di 6 cifre
// che cambia ogni 30 secondi. Obbligatoria per gli admin, facoltativa per tutti

const STEP_S = 30
const DIGITS = 6
// Si accetta anche il codice di 30 secondi prima o dopo: l'orologio del telefono può essere un po' avanti o indietro
const DRIFT_STEPS = 1
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buf: Buffer) {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(text: string) {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) throw new Error('base32')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** Segreto nuovo, 160 bit come consiglia la RFC, in base32 per le app */
export function generateTotpSecret() {
  return base32Encode(randomBytes(20))
}

export function totpStep(now = Date.now()) {
  return Math.floor(now / 1000 / STEP_S)
}

export function totpCode(secret: string, step: number) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1]! & 15
  const bin = hmac.readUInt32BE(offset) & 0x7FFFFFFF
  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0')
}

/**
 * Passo del codice giusto, o null. Un codice già usato (passo non oltre lastStep) non vale una seconda volta:
 * chi lo vede passare non può riusarlo
 */
export function verifyTotp(secret: string, code: string, lastStep: number | null, now = Date.now()) {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return null
  const current = totpStep(now)
  for (let d = -DRIFT_STEPS; d <= DRIFT_STEPS; d++) {
    const step = current + d
    if (lastStep !== null && step <= lastStep) continue
    if (timingSafeEqual(Buffer.from(totpCode(secret, step)), Buffer.from(clean))) return step
  }
  return null
}

/** Indirizzo otpauth:// per il QR code delle app di autenticazione */
export function totpUri(issuer: string, account: string, secret: string) {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_S}`
}

// Codici di emergenza: per entrare se si perde il telefono. Ognuno vale una volta, nel database solo l'impronta
export const RECOVERY_CODES = 10

export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODES }, () => {
    const raw = base32Encode(randomBytes(5)).toLowerCase()
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`
  })
}

export function hashRecoveryCode(code: string) {
  return createHash('sha256').update(code.toLowerCase().replace(/[^a-z2-7]/g, '')).digest('hex')
}

export function isRecoveryCodeShape(code: string) {
  return /^[a-z2-7]{4}-?[a-z2-7]{4}$/i.test(code.trim())
}

// Il segreto si salva cifrato (AES-256-GCM): una copia del database da sola non basta a generare i codici
function keyFrom(secretKey: string) {
  return createHash('sha256').update(`totp:${secretKey}`).digest()
}

export function sealTotpSecret(secret: string, secretKey: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secretKey), iv)
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64url')).join('.')
}

export function openTotpSecret(sealed: string, secretKey: string) {
  const [iv, tag, data] = sealed.split('.').map(p => Buffer.from(p, 'base64url'))
  if (!iv || !tag || !data) throw new Error('totp')
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(secretKey), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
