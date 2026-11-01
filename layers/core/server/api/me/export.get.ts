// Scarica tutti i propri dati in un file JSON (diritto di accesso e portabilità)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const data = await exportAccount(user.id)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="petduel-${user.username}.json"`)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return data
})
