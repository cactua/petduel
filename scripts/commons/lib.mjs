// Accesso educato a Wikimedia Commons: user agent dichiarato, una richiesta alla volta, pause e nuovi tentativi
const UA = 'PetDuelSeed/0.1 (PetDuel development seed script; https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)'
const API = 'https://commons.wikimedia.org/w/api.php'

export const sleep = ms => new Promise(r => setTimeout(r, ms))

async function get(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(5000 * (attempt + 1))
    return get(url, attempt + 1)
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res
}

export async function api(params) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', formatversion: '1', maxlag: '5', ...params })}`
  for (let attempt = 0; attempt < 5; attempt++) {
    const text = await (await get(url)).text()
    if (text.startsWith('{')) return JSON.parse(text)
    await sleep(8000 * (attempt + 1)) // "too many requests" arriva come testo
  }
  throw new Error(`Commons non risponde: ${url}`)
}

export async function fetchBuffer(url) {
  return Buffer.from(await (await get(url)).arrayBuffer())
}

// Solo licenze che permettono il riuso anche commerciale, con o senza attribuzione
export const freeLicense = license => /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?)/i.test(license ?? '')

export const plainText = html => (html ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, '\'').replace(/\s+/g, ' ').trim()
