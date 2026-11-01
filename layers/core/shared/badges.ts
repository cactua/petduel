// Traguardi dei pet: solo cose belle da mostrare, mai un confronto o un numero basso.
// Si calcolano dai dati che ci sono già (cuori, foto, sfide, classifiche passate), senza tabelle apposta.

// Fasce di cuori: si mostra solo la più alta raggiunta, con un nome invece del numero
export const HEART_TIERS = [
  { key: 'loved', min: 25, emoji: '💗' },
  { key: 'adored', min: 100, emoji: '💖' },
  { key: 'star', min: 250, emoji: '🌟' },
  { key: 'legend', min: 1000, emoji: '👑' },
] as const

export const PHOTOGENIC_MIN = 5
export const CHALLENGER_MIN = 3

export type BadgeKey = 'firstWin' | (typeof HEART_TIERS)[number]['key'] | 'petOfWeek' | 'photogenic' | 'challenger' | 'adopted'

export interface Badge {
  key: BadgeKey
  emoji: string
  // Quante volte (solo "Pet della settimana")
  times?: number
}

export interface BadgeStats {
  hearts: number
  approvedPhotos: number
  challenges: number
  // Settimane concluse chiuse al primo posto della propria specie
  weeksFirst: number
  adopted: boolean
}

/** Traguardi raggiunti, dal più prestigioso */
export function petBadges(s: BadgeStats): Badge[] {
  const badges: Badge[] = []
  if (s.weeksFirst > 0) badges.push({ key: 'petOfWeek', emoji: '🏅', times: s.weeksFirst })
  const tier = [...HEART_TIERS].reverse().find(t => s.hearts >= t.min)
  if (tier) badges.push({ key: tier.key, emoji: tier.emoji })
  if (s.adopted) badges.push({ key: 'adopted', emoji: '🏡' })
  if (s.challenges >= CHALLENGER_MIN) badges.push({ key: 'challenger', emoji: '🎯' })
  if (s.approvedPhotos >= PHOTOGENIC_MIN) badges.push({ key: 'photogenic', emoji: '📸' })
  if (s.hearts > 0 && !tier) badges.push({ key: 'firstWin', emoji: '🎉' })
  return badges
}
