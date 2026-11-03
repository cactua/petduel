// Prova a mano le funzioni con il database (segui, preferiti, blocchi, complimenti) sul sito furry in locale.
// Usa gli account di prova di sites/furry/.data/account-di-prova.txt e alla fine rimette tutto com'era.
// Uso: node scripts/smoke-community.mjs [http://localhost:3001]
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:3001'
const creds = readFileSync(new URL('../sites/furry/.data/account-di-prova.txt', import.meta.url), 'utf8')
const PASSWORD = creds.split('\n')[0].split(': ').pop().trim()

let failures = 0
function check(what, ok) {
  console.log(`${ok ? '✓' : '✗'} ${what}`)
  if (!ok) failures++
}

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify({ email, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`accesso ${email}: ${res.status}`)
  const cookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  return async (path, body) => {
    const r = await fetch(`${BASE}${path}`, body === undefined
      ? { headers: { cookie } }
      : { method: 'POST', headers: { cookie, origin: BASE, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return { status: r.status, data: await r.json().catch(() => null) }
  }
}

const volpe = await login('prova5@example.test')
const fennec = await login('prova3@example.test')
const luna = await login('prova1@example.test')

// Un pet di prova_fennec per i preferiti e i complimenti
const profile = (await volpe('/api/users/prova_fennec')).data
const pet = profile.pets[0]

// Segui
check('seguire un utente', (await volpe('/api/users/prova_luna_art/follow', { following: true })).data?.following === true)
check('il profilo dice che lo segui', (await volpe('/api/users/prova_luna_art')).data?.following === true)
check('solo il proprietario vede quanti lo seguono', (await volpe('/api/users/prova_luna_art')).data?.followers === null
  && (await luna('/api/users/prova_luna_art')).data?.followers >= 1)
const feed = (await volpe('/api/me/following')).data
check('chi segui compare in /following', feed?.users.includes('prova_luna_art'))
check('in /following ci sono i lavori dove è indicata come artista', feed?.works.some(w => w.via === 'prova_luna_art'))
check('non si segue sé stessi', (await volpe('/api/users/prova_volpe/follow', { following: true })).status === 400)

// Preferiti
check('salvare un preferito', (await volpe(`/api/pets/${pet.id}/favorite`, { saved: true })).data?.saved === true)
check('il preferito risulta salvato', (await volpe(`/api/pets/${pet.id}/favorite`)).data?.saved === true)
check('compare in /favorites', (await volpe('/api/me/favorites')).data?.some(p => p.id === pet.id))
check('gli altri non vedono i tuoi preferiti', (await fennec(`/api/pets/${pet.id}/favorite`)).data?.saved === false)

// Blocco: smette di seguire, niente complimenti, niente più follow
check('bloccare', (await luna('/api/users/prova_volpe/block', { blocked: true })).data?.blocked === true)
check('chi è bloccato smette di seguire', !(await volpe('/api/me/following')).data?.users.includes('prova_luna_art'))
check('e non può tornare a seguire', (await volpe('/api/users/prova_luna_art/follow', { following: true })).status === 403)
await luna('/api/users/prova_volpe/block', { blocked: false })

// Complimenti: il proprietario vede i conteggi, chi li fa vede i suoi
const before = (await fennec(`/api/pets/${pet.id}/compliments`)).data?.counts.style ?? 0
check('fare un complimento', (await volpe(`/api/pets/${pet.id}/compliments`, { kind: 'style', on: true })).data?.ok === true)
check('il proprietario vede il conteggio', (await fennec(`/api/pets/${pet.id}/compliments`)).data?.counts.style === before + 1)
check('il proprietario non può farsi complimenti', (await fennec(`/api/pets/${pet.id}/compliments`, { kind: 'love', on: true })).status >= 400)

// Rimette tutto com'era
await volpe(`/api/pets/${pet.id}/compliments`, { kind: 'style', on: false })
await volpe(`/api/pets/${pet.id}/favorite`, { saved: false })
await volpe('/api/users/prova_luna_art/follow', { following: false })

console.log(failures ? `\n${failures} prove non riuscite` : '\nTutto a posto')
process.exit(failures ? 1 : 0)
