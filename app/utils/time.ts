// Date e durate nella lingua scelta (le scadenze restano sull'ora italiana)
const t = (key: string, params?: Record<string, unknown>) => useNuxtApp().$i18n.t(key, params ?? {})
const relative = (n: number, unit: Intl.RelativeTimeFormatUnit) =>
  new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'always', style: 'long' }).format(n, unit)

// "tra 3 giorni", "tra 5 ore", "tra pochi minuti"
export function timeUntil(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return t('time.now')
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 24) return relative(Math.floor(hours / 24), 'day')
  if (hours >= 1) return relative(hours, 'hour')
  return t('time.inMinutes')
}

// "2g 14h 03m 12s", "3h 05m 09s": per i conti alla rovescia che si aggiornano ogni secondo
export function countdown(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const [d, h, m, sec] = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
  const hms = `${h}h ${pad(m)}m ${pad(sec)}s`
  return d ? `${t('time.days', { n: d })} ${hms}` : hms
}

// "2 nov" o "lunedì 2 novembre"
export function shortDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString(intlLocale(), long
    ? { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }
    : { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' })
}

// "adesso", "5 min fa", "3 h fa", poi la data
export function timeAgo(iso: string, now = Date.now()) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (min < 1) return t('time.now')
  const short = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'always', style: 'short' })
  if (min < 60) return short.format(-min, 'minute')
  if (min < 24 * 60) return short.format(-Math.floor(min / 60), 'hour')
  return shortDate(iso)
}
