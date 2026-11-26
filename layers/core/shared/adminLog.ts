// Registro admin: da "POST reports" + {"action":"dismiss",...} a una frase che si legge al volo.
// Il server salva metodo, percorso e campi inviati; la frase si costruisce qui, così vale anche per le righe vecchie
import { SITE_SETTING_LABELS, type SiteSettings } from './models'

export type AdminLogKind = 'photos' | 'reports' | 'users' | 'challenges' | 'ads' | 'votes' | 'settings' | 'other'
// Colore dell'icona: buono, cattivo o neutro
export type AdminLogTone = 'ok' | 'bad' | 'neutral'

export interface AdminLogEntry {
  kind: AdminLogKind
  tone: AdminLogTone
  icon: string
  text: string
}

export const ADMIN_LOG_KINDS: Record<AdminLogKind, string> = {
  photos: 'Foto',
  reports: 'Segnalazioni',
  users: 'Utenti',
  challenges: 'Sfide',
  ads: 'Pubblicità',
  votes: 'Voti',
  settings: 'Impostazioni',
  other: 'Altro',
}

type Body = Record<string, unknown>

function parse(detail: string): Body {
  try {
    const v = JSON.parse(detail)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  }
  catch {
    return {}
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const why = (b: Body) => (str(b.reason) ? ` · “${str(b.reason)}”` : '')

export function describeAdminAction(action: string, detail: string): AdminLogEntry {
  const [method = '', path = ''] = action.split(' ')
  const [section = '', rawId = ''] = path.split('/')
  const id = rawId ? `#${rawId}` : ''
  const b = parse(detail)
  const e = (kind: AdminLogKind, tone: AdminLogTone, icon: string, text: string): AdminLogEntry => ({ kind, tone, icon, text })

  switch (`${method} ${section}${rawId ? '/:id' : ''}`) {
    case 'POST photos/:id':
      if (b.action === 'approve') return e('photos', 'ok', '✓', `Ha approvato la foto ${id}`)
      if (b.action === 'reject') return e('photos', 'bad', '✕', `Ha rifiutato la foto ${id}${why(b)}`)
      if (b.action === 'remove') return e('photos', 'bad', '🗑', `Ha tolto dalla gara la foto ${id}${why(b)}`)
      break
    case 'POST reports': {
      const target = b.target === 'user' ? `sull'utente #${b.id}` : `sulla foto #${b.id}`
      if (b.action === 'dismiss') return e('reports', 'neutral', '⚑', `Ha archiviato le segnalazioni ${target}`)
      if (b.action === 'remove') return e('reports', 'bad', '🗑', `Ha tolto la foto segnalata #${b.id}${why(b)}`)
      if (b.action === 'ban') return e('reports', 'bad', '⛔', `Ha bloccato l'utente segnalato #${b.id}`)
      break
    }
    case 'POST users':
      return e('users', 'ok', '👤', `Ha creato l'account ${str(b.username) ? `@${str(b.username)}` : ''}${b.role === 'admin' ? ' (admin)' : ''}`.trim())
    case 'PATCH users/:id': {
      const parts: string[] = []
      if (b.role === 'admin') parts.push(`ha reso admin l'utente ${id}`)
      if (b.role === 'user') parts.push(`ha tolto il ruolo admin all'utente ${id}`)
      if (b.banned === true) parts.push(`ha bloccato l'utente ${id}`)
      if (b.banned === false) parts.push(`ha sbloccato l'utente ${id}`)
      if ('password' in b) parts.push(`ha cambiato la password dell'utente ${id}`)
      if (!parts.length) break
      const text = parts.join(' e ').replace(/^h/, 'H')
      return e('users', b.banned === true ? 'bad' : 'neutral', b.banned === true ? '⛔' : b.role ? '🛡' : '👤', text)
    }
    case 'DELETE users/:id':
      return e('users', 'bad', '🗑', `Ha eliminato l'account ${id}`)
    case 'POST challenges':
      return e('challenges', 'ok', '🏁', `Ha programmato la sfida “${str(b.title)}”${str(b.startDate) ? ` dal ${italianDate(str(b.startDate))}` : ''}`)
    case 'PATCH challenges/:id':
      return e('challenges', 'neutral', '✎', `Ha modificato la sfida ${str(b.title) ? `“${str(b.title)}”` : id}`)
    case 'DELETE challenges/:id':
      return e('challenges', 'bad', '🗑', `Ha eliminato la sfida ${id}`)
    case 'POST ads':
      return e('ads', 'ok', '📣', 'Ha creato una nuova campagna')
    case 'POST ads/:id':
      return e('ads', 'neutral', '✎', `Ha modificato la campagna ${id}`)
    case 'PATCH ads/:id':
      return b.active === false
        ? e('ads', 'neutral', '⏸', `Ha messo in pausa la campagna ${id}`)
        : e('ads', 'ok', '▶', `Ha riattivato la campagna ${id}`)
    case 'DELETE ads/:id':
      return e('ads', 'bad', '🗑', `Ha eliminato la campagna ${id}`)
    case 'PUT ad-settings':
      return e('ads', 'neutral', '⚙', 'Ha cambiato le impostazioni della pubblicità')
    case 'PUT settings': {
      const changes = Array.isArray(b.changes) ? (b.changes as { key: string, from: unknown, to: unknown }[]) : []
      const list = changes.map(c => `${SITE_SETTING_LABELS[c.key as keyof SiteSettings] ?? c.key}: ${settingValue(c.from)} → ${settingValue(c.to)}`)
      return e('settings', 'neutral', '⚙', list.length ? `Ha cambiato le impostazioni · ${list.join(' · ')}` : 'Ha cambiato le impostazioni')
    }
    case 'POST vote-alerts/:id':
      return e('votes', 'neutral', '👁', `Ha segnato come visto l'avviso sui voti ${id}`)
  }
  return e('other', 'neutral', '•', action)
}

// Valore di un'impostazione in parole: null = nessun limite, sì/no per gli interruttori
function settingValue(v: unknown) {
  if (v === null || v === undefined) return 'nessun limite'
  if (typeof v === 'boolean') return v ? 'sì' : 'no'
  return String(v)
}

// "2026-12-07" → "7/12/2026"
function italianDate(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return y && m && d ? `${d}/${m}/${y}` : day
}
