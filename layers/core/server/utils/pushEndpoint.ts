// Servizi push dei browser: Chrome, Edge, Opera, Samsung (Google), Firefox (Mozilla), Safari (Apple), Edge
// su Windows (Microsoft). Il server manda le notifiche solo a questi: un indirizzo qualsiasi permetterebbe
// di fargli chiamare servizi interni o siti di altri
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'web.push.apple.com']
const PUSH_HOST_SUFFIXES = ['.push.apple.com', '.notify.windows.com', '.push.services.mozilla.com']

export function isPushEndpoint(endpoint: string) {
  let url: URL
  try {
    url = new URL(endpoint)
  }
  catch {
    return false
  }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  return PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some(s => host.endsWith(s))
}
