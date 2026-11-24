// Esce da questo dispositivo: oltre a cancellare il cookie, la sessione si segna come chiusa,
// così una copia rubata del cookie smette di funzionare
export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  await revokeSession(user?.sid)
  await clearUserSession(event)
  return { ok: true }
})
