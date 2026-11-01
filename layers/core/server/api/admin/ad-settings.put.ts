import { adSettingsSchema } from '#shared/models'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const value = await readValidatedBody(event, adSettingsSchema.parse)
  await saveAdSettings(value)
  return value
})
