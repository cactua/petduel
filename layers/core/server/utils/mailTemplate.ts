import type { SiteBrand } from '#shared/site'
import { serverT } from './pushText'

// Email del sito in HTML, con la versione in solo testo accanto (chi la preferisce, o i client che non mostrano l'HTML).
// Tabelle e stili in linea perché molti client email ignorano il resto; colori del sito corretti per il contrasto AA

export type MailKind = 'verify' | 'reset' | 'report'

export interface MailInput {
  kind: MailKind
  locale: string
  siteName: string
  brand: SiteBrand
  /** Indirizzo pubblico del sito, senza "/" finale: per l'immagine in testa e il link al sito. null = niente immagine */
  origin: string | null
  /** Nome di chi riceve; senza (chi ha segnalato senza account) il saluto è generico */
  username?: string
  /** Link del pulsante (conferma, nuova password) */
  link?: string
  /** Paragrafo in più, già tradotto (l'esito di una segnalazione) */
  message?: string
}

export interface MailContent {
  subject: string
  text: string
  html: string
}

// --- Colori ---

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
  return [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}
const toHex = (c: number[]) => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/**
 * Il colore più vicino a quello dato che si legge su `against` (rapporto almeno `ratio`):
 * lo scurisce o lo schiarisce a piccoli passi, verso il nero o il bianco, tenendo la tinta
 */
export function readable(color: string, against: string, ratio = 4.5) {
  if (contrast(color, against) >= ratio) return color
  const target = luminance(against) > 0.18 ? [0, 0, 0] : [255, 255, 255]
  const start = rgb(color)
  for (let t = 0.05; t <= 1; t += 0.05) {
    const mixed = toHex(start.map((v, i) => v + (target[i]! - v) * t))
    if (contrast(mixed, against) >= ratio) return mixed
  }
  return toHex(target)
}

// --- Testo ---

const escape = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

export function renderMail(input: MailInput): MailContent {
  const { kind, locale, siteName, brand, origin, username, link, message } = input
  const t = (key: string, params: Record<string, unknown> = {}) => serverT(locale, key, { site: siteName, username, ...params })

  const subject = t(`mail.${kind}.subject`)
  const title = t(`mail.${kind}.title`)
  const hello = username ? t('mail.hello') : t('mail.helloAnon')
  const intro = t(`mail.${kind}.intro`)
  const note = t(`mail.${kind}.note`)
  const button = link ? t(`mail.${kind}.button`) : ''
  const footer = t('mail.footer')

  const text = [hello, intro, message, link, note, siteName].filter(Boolean).join('\n\n')

  // Su carta bianca: testo, pulsante e link leggibili anche con i colori più chiari dei siti
  const paper = '#ffffff'
  const ink = readable(brand.ink, paper, 7)
  const muted = readable(brand.muted, paper)
  const action = readable(brand.accent, '#ffffff')
  // Fuori dalla carta, sullo sfondo del sito: nome in alto e piè di pagina
  const pageInk = readable(brand.ink, brand.background, 7)
  const pageMuted = readable(brand.muted, brand.background)
  const [blob1, blob2] = brand.blobs
  const lang = escape(locale)
  const p = (s: string, extra = '') => `<p style="margin:0 0 16px;font-size:17px;line-height:1.55;color:${ink};${extra}">${escape(s)}</p>`

  const header = origin
    ? `<img src="${escape(`${origin}/mail/header.png`)}" width="600" height="160" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:20px 20px 0 0;">`
    : `<div style="height:12px;background:${brand.accent};border-radius:20px 20px 0 0;"></div>`

  const cta = link
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr><td class="btn" style="border-radius:14px;background:${action};">
    <a href="${escape(link)}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:18px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:14px;">${escape(button)}</a>
  </td></tr>
</table>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:${muted};">${escape(t('mail.fallback'))}</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;word-break:break-all;"><a href="${escape(link)}" class="link" style="color:${action};text-decoration:underline;">${escape(link)}</a></p>`
    : ''

  const messageBox = message
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">
  <tr><td class="box" style="padding:16px 18px;border-radius:14px;background:${blob2 ?? '#f1f1f1'};border-left:4px solid ${action};">
    <p style="margin:0;font-size:17px;line-height:1.55;color:${ink};">${escape(message)}</p>
  </td></tr>
</table>`
    : ''

  const siteLink = origin
    ? `<a href="${escape(origin)}" class="link" style="color:${pageMuted};text-decoration:underline;">${escape(siteName)}</a>`
    : escape(siteName)

  const html = `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escape(subject)}</title>
<style>
  body { margin: 0; padding: 0; }
  a.link:focus, td.btn a:focus { outline: 3px solid ${action}; outline-offset: 3px; }
  @media (max-width: 620px) {
    .card-body { padding: 28px 22px !important; }
    h1 { font-size: 26px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .page { background: #171615 !important; }
    .card { background: #24221f !important; }
    .card-body h1, .card-body p, .box p { color: #f4efe8 !important; }
    .brand { color: #f4efe8 !important; }
    .card-body p.muted, .foot p { color: #c9c0b5 !important; }
    .box { background: #33302b !important; }
    a.link { color: #ffd0b8 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${brand.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escape(t(`mail.${kind}.preheader`))}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.background};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td class="brand" style="padding:0 0 14px 6px;font-family:${FONT};font-size:20px;line-height:1.2;font-weight:800;color:${pageInk};">${escape(siteName)}</td></tr>
  <tr><td class="card" style="background:${paper};border-radius:20px;box-shadow:0 2px 0 ${blob1 ?? '#eeeeee'};">
    ${header}
    <div class="card-body" style="padding:36px 40px 30px;font-family:${FONT};">
      <h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;font-weight:800;color:${ink};">${escape(title)}</h1>
      ${p(hello)}
      ${p(intro)}
      ${messageBox}
      ${cta}
      <p class="muted" style="margin:0;font-size:15px;line-height:1.55;color:${muted};">${escape(note)}</p>
    </div>
  </td></tr>
  <tr><td class="foot" style="padding:20px 10px 0;font-family:${FONT};text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${pageMuted};">${escape(footer)}</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:${pageMuted};">${siteLink}</p>
  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`

  return { subject, text, html }
}
