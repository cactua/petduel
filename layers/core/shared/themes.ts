import site from '#site'

// Calendario automatico delle sfide, diverso per ogni sito (vedi SiteConfig.challengeThemes)
export const CHALLENGE_THEMES = site.challengeThemes

/** Il tema automatico di una sfida ("linguaccia-2026-11-02"), solo se titolo e descrizione non sono stati cambiati */
export function challengeTheme(c: { slug: string, title: string }) {
  const theme = CHALLENGE_THEMES.find(t => c.slug.startsWith(`${t.slug}-`))
  return theme && theme.title === c.title ? theme : undefined
}
