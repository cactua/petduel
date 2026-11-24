import type { H3Event } from 'h3'
import nodemailer, { type Transporter } from 'nodemailer'
import site from '#site'
import { LANGUAGES } from '../../i18n/languages'
import { createEmailToken } from './emailTokens'
import { serverT } from './pushText'

// Email del sito (conferma dell'indirizzo, nuova password) con un server SMTP qualsiasi: NUXT_SMTP_URL nel .env.
// Senza, in sviluppo il testo finisce nel log del server, così i link si possono provare in locale

let transport: Transporter | undefined

export async function sendMail(mail: { to: string, subject: string, text: string }) {
  const { smtpUrl, smtpFrom } = useRuntimeConfig()
  if (!smtpUrl) {
    if (import.meta.dev) {
      console.info(`[email] (sviluppo, non inviata) a ${mail.to}: ${mail.subject}\n${mail.text}`)
      return true
    }
    console.error('[email] NUXT_SMTP_URL non configurato: email non inviata')
    return false
  }
  transport ??= nodemailer.createTransport(smtpUrl)
  try {
    // Le risposte vanno all'email delle pagine legali (chi contesta una decisione, chi chiede aiuto)
    const replyTo = useRuntimeConfig().public.legal.email || undefined
    await transport.sendMail({ from: smtpFrom || site.name, replyTo, ...mail })
    return true
  }
  catch (e) {
    console.error('[email] invio non riuscito', (e as Error).message)
    return false
  }
}

/**
 * Indirizzo del sito per i link nelle email: NUXT_SITE_URL. Solo in sviluppo, se manca, si usa quello della
 * richiesta; in produzione senza NUXT_SITE_URL i link non partono (un Host falso li porterebbe altrove)
 */
export function siteOrigin(event: H3Event) {
  const configured = useRuntimeConfig().siteUrl
  if (configured) return configured.replace(/\/+$/, '')
  if (import.meta.dev) return getRequestURL(event).origin
  return null
}

/** Lingua delle email: quella in cui la persona sta usando il sito, se è una di quelle previste */
export function mailLocale(locale: unknown) {
  return typeof locale === 'string' && LANGUAGES.some(l => l.code === locale) ? locale : 'it'
}

/** Manda il link per confermare l'indirizzo email dell'account */
export async function sendVerifyEmail(event: H3Event, user: { id: number, email: string, username: string }, locale: string) {
  const origin = siteOrigin(event)
  if (!origin) {
    console.error('[email] NUXT_SITE_URL non configurato: link di conferma non inviato')
    return false
  }
  const token = await createEmailToken(user.id, 'verify')
  const params = { site: site.name, username: user.username, link: `${origin}/verify-email?token=${token}` }
  return sendMail({
    to: user.email,
    subject: serverT(locale, 'mail.verifySubject', params),
    text: serverT(locale, 'mail.verifyText', params),
  })
}
