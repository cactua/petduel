import { siteSettingsSchema } from '#shared/models'

// Salva le impostazioni generali. Nel registro delle azioni finisce solo cosa è cambiato, col valore di prima e quello nuovo
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = siteSettingsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const before = await getSiteSettings()
  const changes = settingsChanges(before, parsed.data)
  if (!changes.length) {
    // Niente da salvare: il registro resta pulito
    event.context.adminLogSkip = true
    return parsed.data
  }
  await saveSiteSettings(parsed.data)
  event.context.adminLogDetail = JSON.stringify({ changes })
  return parsed.data
})
