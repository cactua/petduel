import { REJECT_REASONS, type AppNotification } from '#shared/models'
import { challengeTheme } from '#shared/themes'

const i18n = () => useNuxtApp().$i18n

/** Testo tradotto se il messaggio è una chiave (errori delle API, validazioni), altrimenti com'è */
export function tr(msg: string, params?: Record<string, unknown>) {
  const { t, te } = i18n()
  return te(msg) ? t(msg, params ?? {}) : msg
}

/**
 * Nome tradotto della categoria ("Gatto", "Gatti", "tra i gatti"); vuoto se il sito non ha categorie.
 * Nel codice che gira fuori dal setup (computed per useHead, funzioni chiamate dopo un await) va passato il t di useI18n
 */
export function speciesText(species: string, form: 'one' | 'many' | 'among', t: (key: string) => string = i18n().t) {
  return species ? t(`species.${species}.${form}`) : ''
}

/** Lingua del browser per Intl ("it-IT", "en-US"...) */
export const intlLocale = () => i18n().localeProperties.value.language ?? 'it-IT'

/** Titolo e descrizione delle sfide automatiche nella lingua scelta; quelle dei moderatori restano come sono */
export function challengeText<T extends { slug: string, title: string, description?: string }>(c: T) {
  const theme = challengeTheme(c)
  if (!theme) return { title: c.title, description: c.description ?? '' }
  const { t } = i18n()
  return { title: t(`themes.${theme.slug}.title`), description: t(`themes.${theme.slug}.description`) }
}

/** Motivo di rifiuto di una foto: quelli della lista si traducono, quelli scritti a mano no */
export function rejectReason(reason: string) {
  const i = (REJECT_REASONS as readonly string[]).indexOf(reason)
  return i < 0 ? reason : i18n().t(`reasons.${i}`)
}

/** Gli avvisi salvano chiave e parametri: si traducono qui. I vecchi avvisi hanno già il testo */
export function notificationText(n: AppNotification) {
  if (!n.params) return n.text
  const { t } = i18n()
  const p: Record<string, unknown> = { ...n.params }
  if (typeof p.challengeSlug === 'string' && typeof p.challenge === 'string') p.challenge = challengeText({ slug: p.challengeSlug, title: p.challenge }).title
  if (typeof p.reason === 'string') p.reason = rejectReason(p.reason)
  if (typeof p.species === 'string') p.species = speciesText(p.species, 'many')
  // {n} numerico: il testo può avere singolare e plurale
  return typeof p.n === 'number' ? t(n.text, p, p.n) : t(n.text, p)
}
