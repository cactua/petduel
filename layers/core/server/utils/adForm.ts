import { adFieldsSchema } from '#shared/models'

/** Campi del modulo (multipart, tutto testo) → valori della tabella "ads" */
export async function parseAdFields(fields: Record<string, string>) {
  const json = (raw: string | undefined) => {
    try {
      return raw ? JSON.parse(raw) : undefined
    }
    catch {
      return null
    }
  }
  const parsed = adFieldsSchema.safeParse({
    ...fields,
    active: fields.active !== 'false',
    startDate: fields.startDate || null,
    endDate: fields.endDate || null,
    targeting: json(fields.targeting),
    deal: json(fields.deal),
    translations: json(fields.translations),
  })
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dati non validi' })
  const { startDate, endDate, targeting, deal, translations, ...rest } = parsed.data
  // Si salvano solo le lingue diverse dalla predefinita e con qualcosa dentro
  const others = Object.fromEntries(Object.entries(translations)
    .filter(([lang, t]) => lang !== rest.defaultLang && t && (t.title || t.body || t.cta || t.url)))
  if (startDate && endDate && endDate < startDate) throw createError({ statusCode: 400, statusMessage: 'La fine viene prima dell\'inizio' })
  return {
    ...rest,
    targeting: JSON.stringify(targeting),
    deal: JSON.stringify(deal),
    translations: JSON.stringify(others),
    startsAt: await adDateToTime(startDate),
    endsAt: await adDateToTime(endDate, true),
  }
}
