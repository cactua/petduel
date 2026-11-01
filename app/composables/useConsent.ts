import { CONSENT_COOKIE, type Consent } from '#shared/models'

/**
 * Consenso ai cookie degli annunci Google: scelta salvata per 6 mesi, banner riapribile dal menu.
 * Si chiede alla prima visita anche se il circuito Google è spento: la scelta vale da quando si accende
 */
export function useConsent() {
  const cookie = useCookie<Consent | null>(CONSENT_COOKIE, { default: () => null, maxAge: 60 * 60 * 24 * 182, sameSite: 'lax' })
  const reopened = useState('consent-open', () => false)

  function choose(value: Consent) {
    const revoked = cookie.value === 'ads' && value === 'none'
    cookie.value = value
    reopened.value = false
    // Lo script di Google già caricato non si può togliere: si ricarica la pagina senza
    if (revoked && import.meta.client) location.reload()
  }

  return {
    consent: computed(() => cookie.value),
    show: computed(() => cookie.value === null || reopened.value),
    open: () => (reopened.value = true),
    choose,
  }
}
