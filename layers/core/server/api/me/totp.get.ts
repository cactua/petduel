// Stato della verifica in due passaggi per la pagina /account
export default defineEventHandler(async (event) => {
  const user = await loadFullUser(event)
  return {
    enabled: !!user.totpEnabledAt,
    recoveryLeft: user.totpEnabledAt ? user.totpRecovery.length : 0,
    // Gli admin devono averla per usare il pannello
    required: user.role === 'admin' && adminNeedsTotp(),
  }
})
