import { describe, expect, it } from 'vitest'
import {
  base32Decode, base32Encode, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, isRecoveryCodeShape,
  openTotpSecret, sealTotpSecret, totpCode, totpStep, totpUri, verifyTotp,
} from '../layers/core/server/utils/totp'

// Verifica in due passaggi: codici come le app di autenticazione (RFC 6238), segreto cifrato, codici di emergenza

// Segreto di prova della RFC 6238 ("12345678901234567890" in base32)
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

describe('codici TOTP', () => {
  it('base32 va e torna', () => {
    expect(base32Encode(Buffer.from('12345678901234567890'))).toBe(RFC_SECRET)
    expect(base32Decode(RFC_SECRET).toString()).toBe('12345678901234567890')
  })

  it('coincidono con gli esempi della RFC 6238', () => {
    expect(totpCode(RFC_SECRET, totpStep(59_000))).toBe('287082')
    expect(totpCode(RFC_SECRET, totpStep(1_111_111_109_000))).toBe('081804')
    expect(totpCode(RFC_SECRET, totpStep(2_000_000_000_000))).toBe('279037')
  })

  it('accettano il codice di 30 secondi prima o dopo, non di più', () => {
    const now = 1_700_000_000_000
    const step = totpStep(now)
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step), null, now)).toBe(step)
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), null, now)).toBe(step - 1)
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), null, now)).toBe(step + 1)
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 3), null, now)).toBeNull()
  })

  it('un codice già usato non vale una seconda volta', () => {
    const now = 1_700_000_000_000
    const step = totpStep(now)
    const code = totpCode(RFC_SECRET, step)
    expect(verifyTotp(RFC_SECRET, code, step, now)).toBeNull()
    expect(verifyTotp(RFC_SECRET, code, step - 1, now)).toBe(step)
  })

  it('accetta lo spazio in mezzo, rifiuta il resto', () => {
    const now = 1_700_000_000_000
    const code = totpCode(RFC_SECRET, totpStep(now))
    expect(verifyTotp(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, null, now)).not.toBeNull()
    expect(verifyTotp(RFC_SECRET, 'abcdef', null, now)).toBeNull()
    expect(verifyTotp(RFC_SECRET, '', null, now)).toBeNull()
  })

  it('il segreto nuovo è di 160 bit', () => {
    expect(base32Decode(generateTotpSecret())).toHaveLength(20)
  })

  it('l\'indirizzo per il QR ha emittente e account', () => {
    expect(totpUri('FurDuel', 'prova', RFC_SECRET)).toBe(`otpauth://totp/FurDuel%3Aprova?secret=${RFC_SECRET}&issuer=FurDuel&algorithm=SHA1&digits=6&period=30`)
  })
})

describe('segreto cifrato', () => {
  it('si riapre solo con la stessa chiave', () => {
    const sealed = sealTotpSecret(RFC_SECRET, 'chiave-di-prova-lunga-abbastanza')
    expect(sealed).not.toContain(RFC_SECRET)
    expect(openTotpSecret(sealed, 'chiave-di-prova-lunga-abbastanza')).toBe(RFC_SECRET)
    expect(() => openTotpSecret(sealed, 'altra-chiave')).toThrow()
  })
})

describe('codici di emergenza', () => {
  it('sono 10, diversi, nel formato xxxx-xxxx', () => {
    const codes = generateRecoveryCodes()
    expect(codes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
    for (const c of codes) expect(isRecoveryCodeShape(c)).toBe(true)
  })

  it('l\'impronta non dipende da maiuscole e trattino', () => {
    expect(hashRecoveryCode('abcd-efgh')).toBe(hashRecoveryCode('ABCDEFGH'))
    expect(hashRecoveryCode('abcd-efgh')).not.toBe(hashRecoveryCode('abcd-efgi'))
  })

  it('un codice dell\'app non sembra un codice di emergenza', () => {
    expect(isRecoveryCodeShape('123456')).toBe(false)
  })
})
