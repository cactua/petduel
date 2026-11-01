import type { AdSlot, Duel, ShownAd } from '#shared/models'

// Durata dell'animazione "vince" prima di passare alla coppia successiva
const RESULT_MS = 1200

// Traguardi festeggiati con i coriandoli: i primi ravvicinati, poi ogni 100 voti
const isMilestone = (n: number) => [10, 25, 50].includes(n) || (n > 0 && n % 100 === 0)

/**
 * Coda di duelli condivisa tra home e sfide: tiene la coppia corrente, carica la successiva
 * in anticipo (così lo swipe non aspetta la rete) e gestisce voto, messaggi e risultato.
 */
export function useDuelQueue(source: MaybeRefOrGetter<{ duelUrl: string, voteUrl: string, query?: Record<string, unknown>, challenge?: boolean }>) {
  const { t } = useI18n()
  const current = ref<Duel | null>(null)
  const votes = ref(0)
  const toast = ref('')
  const hint = ref('')
  const failed = ref(false)
  // Esito dell'ultimo voto, mostrato sulle card: chi ha vinto e quanti punti ha preso
  const result = ref<{ index: number, delta: number } | null>(null)
  // Cresce a ogni traguardo: cambia la chiave dei coriandoli, che così ripartono
  const celebrate = ref(0)
  // Pubblicità al posto del duello ogni N voti, finché non si tocca "Continua"
  const ad = ref<ShownAd | null>(null)
  let adSlot: Promise<AdSlot | null> | null = null
  // La specie del filtro serve alle campagne mirate (es. crocchette per gatti)
  const fetchAd = () => {
    const species = toValue(source).query?.species
    return $fetch<AdSlot>('/api/ads/next', { query: typeof species === 'string' ? { species } : {} }).catch(() => null)
  }
  async function adDue() {
    const slot = await (adSlot ??= fetchAd())
    if (!slot?.ad || !slot.settings.every) return null
    const { every, startAfter, inChallenges } = slot.settings
    if (toValue(source).challenge && !inChallenges) return null
    const n = votes.value - startAfter
    if (n <= 0 || n % every) return null
    adSlot = fetchAd()
    return slot.ad
  }
  const dismissAd = () => (ad.value = null)

  let next: Promise<Duel> | null = null
  const fetchDuel = () => {
    const { duelUrl, query } = toValue(source)
    return $fetch<Duel>(duelUrl, { query })
  }

  async function load() {
    try {
      failed.value = false
      current.value = await (next ?? fetchDuel())
      next = current.value.pets ? fetchDuel() : null
    }
    catch {
      next = null
      failed.value = true
    }
  }

  // Da chiamare quando cambia la sorgente (filtro specie, sfida diversa)
  function reset() {
    next = null
    current.value = null
    return load()
  }

  async function vote(index: number) {
    const duel = current.value
    if (!duel?.pets || !duel.token) return
    const winner = duel.pets[index]!
    const loser = duel.pets[1 - index]!
    hint.value = t('duel.beat', { winner: winner.name, loser: loser.name })

    const [outcome] = await Promise.allSettled([
      $fetch<{ delta: number }>(toValue(source).voteUrl, { method: 'POST', body: { token: duel.token, winnerId: winner.id } }),
      new Promise(r => setTimeout(r, RESULT_MS / 3)),
    ])
    if (outcome.status === 'fulfilled') {
      votes.value++
      result.value = { index, delta: outcome.value.delta }
      navigator.vibrate?.(25)
      if (isMilestone(votes.value)) {
        celebrate.value++
        toast.value = `🎉 ${t('duel.votesMilestone', { n: votes.value })}`
      }
    }
    else {
      toast.value = errorMessage(outcome.reason, 'duel.voteFailed')
    }

    const showAd = outcome.status === 'fulfilled' ? adDue() : null
    setTimeout(async () => {
      toast.value = ''
      hint.value = ''
      result.value = null
      ad.value = (await showAd) ?? null
      await load()
    }, RESULT_MS)
  }

  return { current, votes, toast, hint, failed, result, celebrate, ad, dismissAd, load, reset, vote }
}
