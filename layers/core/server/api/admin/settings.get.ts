// Impostazioni generali del sito, per il pannello admin
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getSiteSettings()
})
