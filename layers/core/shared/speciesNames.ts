import it from '../i18n/locales/it.json'

// Nomi italiani delle categorie per i testi che restano in italiano (pannello admin, card da condividere).
// Il resto del sito li prende dai file di lingua con $t('species.<id>.one|many|among')
const names = it.species as Record<string, { one: string, many: string, among: string } | string>

export function speciesName(id: string, form: 'one' | 'many' | 'among') {
  const n = names[id]
  return typeof n === 'object' ? n[form] : ''
}
