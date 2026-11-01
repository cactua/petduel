import site from '#site'

// Il nome del sito è lo stesso in ogni lingua: i testi lo richiamano con "@:site.name"
const base = { site: { name: site.name } }

export default defineI18nConfig(() => ({
  messages: { it: base, en: base, es: base, fr: base, de: base },
}))
