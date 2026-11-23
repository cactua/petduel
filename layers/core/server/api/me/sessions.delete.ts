// Esci da tutti gli altri dispositivi: le loro sessioni non valgono più, questa resta aperta
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await revokeOtherSessions(event, user.id)
  return { ok: true }
})
