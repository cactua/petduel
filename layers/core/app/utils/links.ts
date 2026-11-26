// Nome leggibile di una pagina social a partire dal link: "https://www.furaffinity.net/user/x" → "FurAffinity"
const KNOWN_SITES: Record<string, string> = {
  'furaffinity.net': 'FurAffinity',
  'bsky.app': 'Bluesky',
  'x.com': 'X',
  'twitter.com': 'X',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'twitch.tv': 'Twitch',
  'tumblr.com': 'Tumblr',
  'deviantart.com': 'DeviantArt',
  'artstation.com': 'ArtStation',
  'ko-fi.com': 'Ko-fi',
  'patreon.com': 'Patreon',
  'inkbunny.net': 'Inkbunny',
  'weasyl.com': 'Weasyl',
  'toyhou.se': 'Toyhouse',
  'itch.io': 'itch.io',
  'linktr.ee': 'Linktree',
  'vgen.co': 'VGen',
  'mastodon.social': 'Mastodon',
}

/** Sito di un link: il nome noto (FurAffinity, Bluesky…) o il dominio; null se non è un indirizzo http/https */
export function linkPlatform(url: string): { name: string, known: boolean } | null {
  let host: string
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    host = u.hostname.toLowerCase().replace(/^www\./, '')
  }
  catch {
    return null
  }
  if (!host.includes('.')) return null
  // Anche i sottodomini: "nome.tumblr.com", "nome.itch.io"
  const known = Object.keys(KNOWN_SITES).find(k => host === k || host.endsWith(`.${k}`))
  return known ? { name: KNOWN_SITES[known]!, known: true } : { name: host, known: false }
}

export function linkLabel(url: string) {
  return linkPlatform(url)?.name ?? url
}

/**
 * Chi scrive "instagram.com/nome" o "www.vgen.co/nome" intende https://: lo aggiungiamo noi.
 * Il resto resta com'è (il controllo dirà se non va)
 */
export function withProtocol(input: string) {
  const v = input.trim()
  if (!v || /^[a-z][a-z\d+.-]*:/i.test(v)) return v
  return /^[\w-]+(\.[\w-]+)+(?:[/?#]\S*)?$/.test(v) ? `https://${v.replace(/^\/+/, '')}` : v
}

// Pagina di un partecipante (/pet/<id> o come la chiama il sito): disponibile in tutte le pagine e componenti
export { entryUrl } from '#shared/models'
