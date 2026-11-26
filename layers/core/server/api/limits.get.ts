// Limiti di caricamento del sito, per avvisare chi carica prima che provi: quante voci, quante immagini per voce,
// se caricamenti e iscrizioni sono aperti, e se i limiti valgono per chi chiede (admin e rifugi approvati no)
export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  const current = user ? await loadSessionUser(user) : null
  return getSiteLimits(current)
})
