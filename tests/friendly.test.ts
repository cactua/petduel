import { describe, expect, it } from 'vitest'
import { COMPLIMENTS, NEW_ACCOUNT_VOTE_WEIGHT, PHOTO_REPORT_REASONS, artistSettingsSchema, entryUrl, rankingPath, reportSchema, signupSchema, type Species } from '#shared/models'
import { BURST_LIMIT, BURST_WINDOW_MS, NEW_ACCOUNT_DAYS, USER_DAILY_CAP, accountVoteWeight, burstHits, isBurst } from '#shared/voteRules'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 3, 12)

describe('peso dei voti con account', () => {
  const old = new Date(NOW - 30 * DAY)

  it('un account vecchio vota a peso pieno', () => {
    expect(accountVoteWeight(1, old, NOW)).toBe(1)
  })

  it('un account nuovo vota a peso ridotto finché non passano i giorni', () => {
    expect(accountVoteWeight(1, new Date(NOW - DAY), NOW)).toBe(NEW_ACCOUNT_VOTE_WEIGHT)
    expect(accountVoteWeight(1, new Date(NOW - NEW_ACCOUNT_DAYS * DAY - 1), NOW)).toBe(1)
  })

  it('oltre il tetto giornaliero il voto non conta', () => {
    expect(accountVoteWeight(USER_DAILY_CAP, old, NOW)).toBe(1)
    expect(accountVoteWeight(USER_DAILY_CAP + 1, old, NOW)).toBe(0)
  })

  it('un account che non esiste più non vota a peso pieno', () => {
    expect(accountVoteWeight(1, null, NOW)).toBe(NEW_ACCOUNT_VOTE_WEIGHT)
  })
})

describe('raffiche di voti', () => {
  it('scatta solo oltre la soglia', () => {
    let hits: number[] = []
    for (let i = 0; i < BURST_LIMIT; i++) hits = burstHits(hits, NOW + i)
    expect(isBurst(hits)).toBe(false)
    expect(isBurst(burstHits(hits, NOW + BURST_LIMIT))).toBe(true)
  })

  it('i voti fuori dalla finestra non contano più', () => {
    const old = Array.from({ length: BURST_LIMIT * 2 }, (_, i) => NOW - BURST_WINDOW_MS - i)
    const hits = burstHits(old, NOW)
    expect(hits).toEqual([NOW])
    expect(isBurst(hits)).toBe(false)
  })
})

describe('iscrizione e regole', () => {
  const base = { email: 'a@example.test', username: 'prova_utente', password: 'Una-password-lunga-1' }

  it('senza accettare le regole non ci si iscrive', () => {
    expect(signupSchema.safeParse({ ...base, rules: false }).success).toBe(false)
    expect(signupSchema.safeParse(base).success).toBe(false)
  })

  it('accettandole sì', () => {
    expect(signupSchema.safeParse({ ...base, rules: true }).success).toBe(true)
  })
})

describe('segnalazioni', () => {
  it('le immagini fatte con l\'IA si possono segnalare', () => {
    expect(PHOTO_REPORT_REASONS).toContain('ai')
    expect(reportSchema.safeParse({ target: 'photo', id: 1, reason: 'ai', note: '' }).success).toBe(true)
  })

  it('un motivo da immagine non vale per un profilo', () => {
    expect(reportSchema.safeParse({ target: 'user', username: 'qualcuno', reason: 'ai', note: '' }).success).toBe(false)
  })
})

describe('impostazioni da artista', () => {
  it('le commissioni sono facoltative', () => {
    const parsed = artistSettingsSchema.parse({ isArtist: true, links: [] })
    expect(parsed.commissions).toBe('')
  })

  it('accetta solo stati noti', () => {
    expect(artistSettingsSchema.safeParse({ isArtist: true, links: [], commissions: 'open', commissionsUrl: 'https://ko-fi.com/x' }).success).toBe(true)
    expect(artistSettingsSchema.safeParse({ isArtist: true, links: [], commissions: 'forse' }).success).toBe(false)
  })
})

describe('complimenti', () => {
  it('sono una lista chiusa, senza testo libero', () => {
    expect(COMPLIMENTS.length).toBeGreaterThan(0)
    expect(new Set(COMPLIMENTS).size).toBe(COMPLIMENTS.length)
  })
})

describe('indirizzi', () => {
  it('la pagina di un partecipante usa la parola del sito', () => {
    expect(entryUrl(7)).toBe('/pet/7')
  })

  it('senza categoria la coccarda porta alla classifica generale', () => {
    expect(rankingPath('' as Species)).toBe('/leaderboard')
    expect(rankingPath(undefined)).toBe('/leaderboard')
    expect(rankingPath('gatto')).toBe('/leaderboard/cats')
  })
})
