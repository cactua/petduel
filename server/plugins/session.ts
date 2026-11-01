// Quando il sito chiede la sessione (/api/_auth/session) l'utente si rilegge dal database:
// ruolo aggiornato, e un account non più esistente viene disconnesso
export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    if (!session.user) return
    const current = await loadSessionUser(session.user)
    if (current) {
      session.user = current
      return
    }
    await clearUserSession(event)
    for (const key of Object.keys(session)) Reflect.deleteProperty(session, key)
  })
})
