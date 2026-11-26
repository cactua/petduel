import { isHouseAd, type AdSlot, type Duel, type ShownAd } from '#shared/models'

// Invito a fare pubblicità già mostrato in questa visita (fino al prossimo caricamento della pagina)
let houseShown = false

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
  const { haptics } = useA11yPrefs()
  const current = ref<Duel | null>(null)
  // Voti dati in tutto, condivisi tra home e sfide: il cuore nella testata non riparte da zero cambiando pagina.
  // Si chiedono al server una volta per visita e di nuovo se cambia l'account (anche entrando da /login,
  // quando questa pagina non c'era): votesOf dice per chi è il numero, poi cresce a ogni voto
  const { user, fetch: refreshSession } = useUserSession()
  const voterKey = () => String(user.value?.id ?? 'anon')
  const votes = useState('duel-votes', () => 0)
  const votesOf = useState<string | null>('duel-votes-of', () => null)
  // Voti di questa visita (fino al prossimo caricamento della pagina): la pubblicità conta questi, non il totale,
  // così "dopo i primi N voti di ogni visita" vale davvero, anche per chi ha già votato tanto o è appena uscito
  const visitVotes = useState('duel-visit-votes', () => 0)
  const loadVotes = async () => {
    const key = voterKey()
    const { count } = await $fetch<{ count: number }>('/api/me/vote-count', { cache: 'no-store' })
    votes.value = count
    votesOf.value = key
  }
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
    const n = visitVotes.value - startAfter
    if (n <= 0 || n % every) return null
    adSlot = fetchAd()
    // L'invito a fare pubblicità qui si vede una volta per visita, non ogni N voti
    if (isHouseAd(slot.ad)) {
      if (houseShown) return null
      houseShown = true
    }
    return slot.ad
  }
  const dismissAd = () => (ad.value = null)

  let next: Promise<Duel> | null = null
  const fetchDuel = () => {
    const { duelUrl, query } = toValue(source)
    // Ogni duello è nuovo: senza no-store il browser mette in fila le richieste identiche dietro una rimasta appesa
    return $fetch<Duel>(duelUrl, { query, cache: 'no-store' })
  }

  async function load(retried = false) {
    try {
      failed.value = false
      // Il totale arriva insieme alla prima coppia: così la guida "trascina sulla foto" non compare a chi ha già votato
      const [duel] = await Promise.all([next ?? fetchDuel(), votesOf.value === voterKey() ? null : loadVotes().catch(() => {})])
      // La sessione è cambiata in un'altra scheda (accesso, uscita, altro account): la pagina mostrerebbe un account
      // e il server sceglierebbe le coppie per un altro, comprese le tue foto. Si rilegge la sessione (testata e menu
      // si aggiornano) e si ricomincia la coda, con il totale dei voti del nuovo votante. Una volta sola per giro
      if (duel.viewer !== undefined && duel.viewer !== (user.value?.id ?? null)) {
        next = null
        current.value = null
        await refreshSession()
        if (retried || duel.viewer !== (user.value?.id ?? null)) throw new Error('sessione diversa dal server')
        return await load(true)
      }
      current.value = duel
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

  // Il token di ogni coppia è legato al votante: entrando o uscendo dall'account cambia,
  // e le coppie già in pagina (anche quella precaricata) non si possono più votare
  watch(() => user.value?.id, (now, before) => {
    if (now !== before && (current.value || failed.value)) reset()
  })

  // Nessuno dei due convince, o piacciono uguale: si passa alla coppia dopo senza votare (la coppia può tornare più avanti)
  // Non durante un voto: hint si riempie appena si sceglie
  function skip() {
    if (!current.value?.pets || result.value || hint.value) return
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
      visitVotes.value++
      result.value = { index, delta: outcome.value.delta }
      if (haptics.value) navigator.vibrate?.(25)
      if (isMilestone(votes.value)) {
        celebrate.value++
        toast.value = `🎉 ${t('duel.votesMilestone', { n: votes.value })}`
      }
    }
    else {
      toast.value = errorMessage(outcome.reason, 'duel.voteFailed')
      // Anche la coppia precaricata potrebbe avere un token ormai scaduto (sessione cambiata in un'altra scheda)
      next = null
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

  return { current, votes, toast, hint, failed, result, celebrate, ad, dismissAd, load, reset, vote, skip }
}
