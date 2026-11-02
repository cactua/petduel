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

export function linkLabel(url: string) {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  }
  catch {
    return url
  }
  // Anche i sottodomini: "nome.tumblr.com", "nome.itch.io"
  const known = Object.keys(KNOWN_SITES).find(k => host === k || host.endsWith(`.${k}`))
  return known ? KNOWN_SITES[known]! : host
}
