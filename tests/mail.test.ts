import { describe, expect, it } from 'vitest'
import { DEFAULT_BRAND } from '#shared/site'
import { LANGUAGES } from '../layers/core/i18n/languages'
import { contrast, readable, renderMail, type MailInput } from '../layers/core/server/utils/mailTemplate'
import furry from '../sites/furry/site.config'
import moto from '../sites/moto/site.config'

const base: MailInput = {
  kind: 'verify', locale: 'it', siteName: 'PetDuel', brand: DEFAULT_BRAND,
  origin: 'https://petduel.example', username: 'biscotto', link: 'https://petduel.example/verify-email?token=abc',
}

describe('colori leggibili', () => {
  it('lascia un colore che ha già abbastanza contrasto', () => {
    expect(readable('#1f1a17', '#ffffff')).toBe('#1f1a17')
  })
  it('scurisce gli accenti chiari dei siti finché il testo bianco si legge (AA)', () => {
    for (const brand of [DEFAULT_BRAND, moto.brand!, furry.brand!]) {
      expect(contrast(readable(brand.accent, '#ffffff'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
      expect(contrast(readable(brand.muted, brand.background), brand.background)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('email del sito', () => {
  it('ha HTML e testo con oggetto, saluto, pulsante e link', () => {
    const mail = renderMail(base)
    expect(mail.subject).toBe('Conferma la tua email su PetDuel')
    expect(mail.html).toContain('<html lang="it"')
    expect(mail.html).toContain('Ciao biscotto,')
    expect(mail.html).toContain(`href="${base.link}"`)
    expect(mail.html).toContain('src="https://petduel.example/mail/header.png"')
    expect(mail.html).toContain('alt=""')
    expect(mail.text).toContain(base.link)
    expect(mail.text).toContain('Ciao biscotto,')
    expect(mail.text).not.toContain('<')
  })

  it('non lascia chiavi di traduzione scoperte in nessuna lingua', () => {
    for (const { code } of LANGUAGES) {
      for (const kind of ['verify', 'reset', 'report'] as const) {
        const report = kind === 'report'
        const mail = renderMail({ ...base, kind, locale: code, message: report ? 'Esito' : undefined, link: report ? undefined : base.link })
        expect(mail.html).not.toMatch(/mail\.\w+/)
        expect(mail.text).not.toMatch(/mail\.\w+|\{\w+\}/)
        expect(mail.html).toContain(`<html lang="${code}"`)
      }
    }
  })

  it('protegge il nome utente e il link dall\'HTML', () => {
    const mail = renderMail({ ...base, username: '<b>x</b>', link: 'https://a.example/?a=1&b="2"' })
    expect(mail.html).not.toContain('<b>x</b>')
    expect(mail.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(mail.html).toContain('href="https://a.example/?a=1&amp;b=&quot;2&quot;"')
  })

  it('la segnalazione senza account ha saluto generico, l\'esito e nessun pulsante', () => {
    const mail = renderMail({ ...base, kind: 'report', username: undefined, link: undefined, message: 'Siamo intervenuti.' })
    expect(mail.text.startsWith('Ciao,')).toBe(true)
    expect(mail.html).toContain('Siamo intervenuti.')
    expect(mail.html).not.toContain('class="btn"')
  })

  it('senza indirizzo del sito niente immagine in testa', () => {
    const mail = renderMail({ ...base, origin: null })
    expect(mail.html).not.toContain('<img')
  })
})
