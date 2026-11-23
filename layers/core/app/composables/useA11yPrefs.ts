/**
 * Preferenze di accessibilità di chi visita: restano in cookie (come il tema), così il server
 * manda già la pagina giusta. Valgono su questo dispositivo, anche senza account.
 * - motion: "reduce" toglie animazioni e coriandoli, anche se il telefono non lo chiede
 * - contrast: "more" rende testi grigi e bordi più marcati
 * - haptics: "off" spegne la vibrazione quando si vota
 */
const YEAR = 60 * 60 * 24 * 365

export function useA11yPrefs() {
  const opts = { default: () => null, maxAge: YEAR, sameSite: 'lax' as const }
  const motionCookie = useCookie<string | null>('a11y-motion', opts)
  const contrastCookie = useCookie<string | null>('a11y-contrast', opts)
  const hapticsCookie = useCookie<string | null>('a11y-haptics', opts)

  const lessMotion = computed({
    get: () => motionCookie.value === 'reduce',
    set: v => (motionCookie.value = v ? 'reduce' : null),
  })
  const moreContrast = computed({
    get: () => contrastCookie.value === 'more',
    set: v => (contrastCookie.value = v ? 'more' : null),
  })
  const haptics = computed({
    get: () => hapticsCookie.value !== 'off',
    set: v => (hapticsCookie.value = v ? null : 'off'),
  })

  // Vale la scelta fatta qui oppure quella del sistema operativo
  const prefersLessMotion = () => lessMotion.value || (import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches)

  return { lessMotion, moreContrast, haptics, prefersLessMotion }
}

/** Mette le scelte su <html> (data-motion, data-contrast): i fogli di stile fanno il resto */
export function useA11yHtmlAttrs() {
  const { lessMotion, moreContrast } = useA11yPrefs()
  useHead({
    htmlAttrs: {
      'data-motion': () => (lessMotion.value ? 'reduce' : undefined),
      'data-contrast': () => (moreContrast.value ? 'more' : undefined),
    },
  })
}
