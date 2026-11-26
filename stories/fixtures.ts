// Dati di esempio per le storie, diversi per ogni sito: PetDuel e BikeDuel usano i partecipanti e le foto del
// seed del database (sites/<sito>/server/assets/seed), FurDuel dei personaggi disegnati apposta (.storybook/assets).
// Le date sono relative a oggi, così conti alla rovescia e "2 ore fa" restano credibili
import site from '#site'
import type {
  AdDeal, AdminAd, AdTargeting, AppNotification, Artwork, ChallengeDetail, ChallengeSummary, NotificationList,
  PetCompliments, PetGallery, PetPhoto, Profile, PublicPet, RankedPet, SonaSheet,
} from '#shared/models'
import { AD_DEAL_DEFAULT, AD_TARGETING_DEFAULT, REJECT_REASONS } from '#shared/models'
import petsSeed from '../sites/pets/server/assets/seed/pets.json'
import motoSeed from '../sites/moto/server/assets/seed/pets.json'

interface SeedPet { name: string, species: string, breed: string, city: string, photos: { file: string, credit: string, url: string }[] }

const FURRY: SeedPet[] = [
  ['Ember', 'Volpe rossa', 'oc-1.svg', 'fennecart'],
  ['Ash', 'Lupo grigio', 'oc-2.svg', 'grey.paws'],
  ['Skye', 'Drago marino', 'oc-3.svg', 'tidaldraws'],
  ['Hazel', 'Procione', 'oc-4.svg', 'mapleink'],
  ['Ruby', 'Gatto selvatico', 'oc-5.svg', 'rubyfox'],
  ['Moss', 'Lucertola', 'oc-6.svg', 'leafscale'],
].map(([name, breed, file, artist]) => ({ name: name!, species: '', breed: breed!, city: '', photos: [{ file: file!, credit: `@${artist}`, url: `/u/${artist}` }] }))

const SEEDS: Record<string, { pets: SeedPet[], base: string }> = {
  pets: { pets: petsSeed as SeedPet[], base: '/seed/pets/' },
  moto: { pets: motoSeed as SeedPet[], base: '/seed/moto/' },
  furry: { pets: FURRY, base: '/sb/furry/' },
}
const seed = SEEDS[site.id] ?? SEEDS.pets!
const OWNERS = ['giulia', 'marco_b', 'sara.v', 'luca88', 'elena', 'davide_m', 'chiara', 'paolo']

const DAY = 24 * 60 * 60 * 1000
export const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
export const inFuture = (ms: number) => new Date(Date.now() + ms).toISOString()

/** Il partecipante n° i del sito scelto (si ricomincia dall'inizio quando finiscono) */
export function entry(i = 0): PublicPet {
  // Una specie diversa per i primi esempi, così le storie mostrano categorie diverse
  const pool = seed.pets
  const bySpecies = [...pool.reduce((m, p) => (m.has(p.species) ? m : m.set(p.species, p)), new Map<string, SeedPet>()).values()]
  const p = i < bySpecies.length ? bySpecies[i]! : pool[i % pool.length]!
  const photo = p.photos[0]!
  return {
    id: i + 1,
    name: p.name,
    species: p.species,
    breed: p.breed,
    city: p.city,
    image: seed.base + photo.file,
    credit: { text: photo.credit, url: photo.url },
    photoId: 100 + i,
    owner: OWNERS[i % OWNERS.length]!,
    adoption: null,
  }
}
export const entries = (n: number, from = 0) => Array.from({ length: n }, (_, i) => entry(from + i))

/** Coppia per un duello */
export const duelPair = (): [PublicPet, PublicPet] => [entry(0), entry(1)]

export function ranked(n = 5): RankedPet[] {
  return entries(n).map((p, i) => ({ ...p, rank: i + 1, speciesRank: 1, score: 420 - i * 57 }))
}

function photo(p: PublicPet, i: number, extra: Partial<PetPhoto> = {}): PetPhoto {
  return { id: p.photoId! + i * 10, image: p.image, status: 'approved', inDuels: true, rejectReason: null, credit: p.credit ?? null, createdAt: ago((i + 1) * 3 * DAY), ...extra }
}

/** Pagina di un partecipante: più foto (una in attesa, una rifiutata per mostrare gli stati al proprietario) */
export function gallery(i = 0, opts: { owner?: boolean, sona?: boolean } = {}): PetGallery {
  const p = entry(i)
  const others = entries(3, i + 6)
  const photos: PetPhoto[] = [
    photo(p, 0),
    photo({ ...p, image: others[0]!.image }, 1),
    photo({ ...p, image: others[1]!.image }, 2, opts.owner ? { status: 'pending', inDuels: false } : {}),
    ...(opts.owner ? [photo({ ...p, image: others[2]!.image }, 3, { status: 'rejected', inDuels: false, rejectReason: REJECT_REASONS[0] })] : []),
  ]
  const { image: _image, ...rest } = p
  return {
    ...rest,
    wins: opts.owner ? 137 : undefined,
    badges: [{ key: 'firstWin', emoji: '🥇' }, { key: 'adored', emoji: '💖' }, { key: 'petOfWeek', emoji: '👑', times: 2 }, { key: 'photogenic', emoji: '📸' }],
    photos,
    trophies: challenges().slice(0, 2).map(c => ({ slug: c.slug, title: c.title, emoji: c.emoji, endsAt: ago(10 * DAY), translations: c.translations })),
    adoptionInfo: null,
    sona: opts.sona ? sonaSheet() : null,
  }
}

export function sonaSheet(): SonaSheet {
  return {
    species: 'Volpe rossa',
    pronouns: 'lei/lui',
    about: 'Esploratrice curiosa, sempre con una mappa in tasca. Ama i tramonti e le storie attorno al fuoco.',
    traits: 'Coda con la punta bianca, sciarpa verde, cicatrice sull\'orecchio sinistro',
    palette: [
      { name: 'Pelo', hex: '#f97316' },
      { name: 'Pancia', hex: '#fde68a' },
      { name: 'Occhi', hex: '#7c2d12' },
      { name: 'Sciarpa', hex: '#16a34a' },
    ],
    yes: ['Fan art', 'Versioni chibi', 'Stili diversi'],
    no: ['Contenuti espliciti', 'Uso commerciale'],
  }
}

// --- Sfide ---
const THEMES = site.challengeThemes.length
  ? site.challengeThemes
  : [
      { slug: 'autumn-palette', title: 'Palette d\'autunno', emoji: '🍂', description: 'Il personaggio con i colori caldi dell\'autunno.' },
      { slug: 'chibi', title: 'Versione chibi', emoji: '🧸', description: 'Testa grande, corpo piccolo: il personaggio in versione tenera.' },
      { slug: 'night-sky', title: 'Cielo stellato', emoji: '🌌', description: 'Una scena notturna con stelle e luci.' },
    ]

export function challenges(): ChallengeSummary[] {
  const [a, b, c] = [THEMES[0]!, THEMES[1] ?? THEMES[0]!, THEMES[2] ?? THEMES[0]!]
  const leaders = entries(3).map(p => ({ petId: p.id, name: p.name, image: p.image }))
  const w = entry(4)
  return [
    { id: 1, slug: a.slug, title: a.title, description: a.description, emoji: a.emoji, species: null, startsAt: ago(3 * DAY), endsAt: inFuture(4 * DAY + 5 * 3600_000), status: 'active', entries: 48, winner: null, leaders, adoptionOnly: false, translations: {} },
    { id: 2, slug: b.slug, title: b.title, description: b.description, emoji: b.emoji, species: site.categories[1]?.id ?? null, startsAt: inFuture(4 * DAY), endsAt: inFuture(11 * DAY), status: 'upcoming', entries: 0, winner: null, leaders: [], adoptionOnly: false, translations: {} },
    { id: 3, slug: c.slug, title: c.title, description: c.description, emoji: c.emoji, species: null, startsAt: ago(10 * DAY), endsAt: ago(3 * DAY), status: 'ended', entries: 61, winner: { petId: w.id, name: w.name, image: w.image, owner: w.owner }, leaders: [], adoptionOnly: false, translations: {} },
  ]
}
export const challengeList = () => {
  const [current, upcoming, past] = challenges()
  return { current: [current!], upcoming: [upcoming!], past: [past!] }
}
export function challengeDetail(): ChallengeDetail {
  return { ...challenges()[0]!, standings: ranked(3).map((p, i) => ({ ...p, entryId: 500 + i })), myEntries: [] }
}

// --- Avvisi ---
export function notifications(): NotificationList {
  const p = entry(0)
  const items: AppNotification[] = [
    { id: 1, emoji: '💖', text: `${p.name} ha appena raggiunto 100 cuori!`, link: `/${site.entryPath ?? 'pet'}/${p.id}`, read: false, createdAt: ago(40 * 60_000) },
    { id: 2, emoji: '✅', text: 'La tua foto è stata approvata ed è in gara', link: null, read: false, createdAt: ago(5 * 3600_000) },
    { id: 3, emoji: '🏆', text: `${p.name} è sul podio della sfida della settimana`, link: '/challenges', read: true, createdAt: ago(2 * DAY) },
  ]
  return { items, unread: 2 }
}

// --- Utenti e profili ---
export const USER = { id: 7, username: 'giulia', role: 'user' as const }
export const ADMIN = { id: 1, username: 'admin', role: 'admin' as const }

export function profile(opts: { isMe?: boolean, artist?: boolean } = {}): Profile {
  return {
    username: 'giulia',
    memberSince: ago(200 * DAY),
    isMe: !!opts.isMe,
    shelter: null,
    votes: 1280,
    pets: [gallery(0, { owner: opts.isMe }), gallery(1, { owner: opts.isMe })],
    manage: null,
    artist: opts.artist ? { links: ['https://www.instagram.com/esempio', 'https://bsky.app/profile/esempio'], commissions: 'open', commissionsUrl: 'https://ko-fi.com/esempio' } : null,
    artworks: artworks(),
    blocked: false,
    following: false,
    followers: opts.isMe ? 54 : null,
    bio: 'Fotografo per passione, sempre in giro con la macchina fotografica.',
    pronouns: 'lei/lei',
    avatar: null,
    banner: null,
  }
}

export const artworks = (): Artwork[] => entries(4, 2).map(p => ({ photoId: p.photoId!, petId: p.id, name: p.name, owner: p.owner, image: p.image }))

export const compliments = (opts: { owner?: boolean } = {}): PetCompliments => ({
  mine: ['love'],
  counts: opts.owner ? { love: 12, style: 5, colors: 3, expression: 7, idea: 1 } : null,
  canGive: !opts.owner,
})

// --- Pubblicità (admin) ---
export const targeting = (): AdTargeting => ({
  ...AD_TARGETING_DEFAULT,
  countries: ['IT', 'CH'],
  places: [{ label: 'Milano, Lombardia', lat: 45.4642, lng: 9.19, km: 30 }],
  languages: ['it'],
  species: site.categories.slice(0, 2).map(c => c.id),
  days: [6, 7],
  hours: { from: 9, to: 21 },
})
export const deal = (): AdDeal => ({
  ...AD_DEAL_DEFAULT,
  contactName: 'Anna Bianchi',
  contactEmail: 'anna@esempio.it',
  contactPhone: '+39 02 1234567',
  notes: 'Rinnovo a fine mese se i clic superano i 300.',
  priceType: 'cpm',
  priceCents: 450,
  maxViews: 50000,
  maxClicks: null,
  maxPerPersonDay: 3,
})
export const AD_IMAGE = entry(3).image

export function adminAd(): AdminAd {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10)
    const views = 300 + Math.round(Math.sin(i / 2) * 120) + i * 20
    return { day: d, views, clicks: Math.round(views * 0.03) }
  })
  return {
    id: 1,
    name: 'Campagna primavera',
    advertiser: 'Negozio Esempio',
    title: 'Tutto per i tuoi compagni',
    body: 'Spedizione gratuita sopra i 30 €, solo questa settimana.',
    cta: 'Scopri',
    url: 'https://example.com',
    weight: 3,
    active: true,
    startDate: null,
    endDate: null,
    targeting: targeting(),
    deal: deal(),
    defaultLang: 'it',
    translations: {},
    image: AD_IMAGE,
    imageSource: AD_IMAGE,
    imageCrop: null,
    status: 'live',
    views: days.reduce((s, d) => s + d.views, 0),
    uniqueViews: 3100,
    clicks: days.reduce((s, d) => s + d.clicks, 0),
    uniqueClicks: 140,
    viewsToday: days.at(-1)!.views,
    valueCents: 2210,
    days,
    places: [
      { country: 'IT', city: 'Milano', views: 2100, clicks: 70 },
      { country: 'IT', city: 'Roma', views: 1300, clicks: 41 },
      { country: 'CH', city: 'Lugano', views: 400, clicks: 12 },
      { country: null, city: null, views: 220, clicks: 3 },
    ],
    languages: [{ lang: 'it', views: 3600, clicks: 110 }, { lang: 'en', views: 420, clicks: 16 }],
    hours: Array.from({ length: 24 }, (_, h) => (h >= 8 && h <= 23 ? Math.round(80 + Math.sin(h / 3) * 60 + (h > 18 ? 90 : 0)) : 10)),
  }
}

/** Le giornate degli ultimi 14 giorni, per i grafici */
export const lastDays = (n = 14, scale = 100) =>
  Array.from({ length: n }, (_, i) => ({ day: new Date(Date.now() - (n - 1 - i) * DAY).toISOString().slice(0, 10), value: Math.max(0, Math.round(scale * (1 + Math.sin(i / 1.7)) / 2 + i * scale / 20)) }))

/** Id con una card da condividere vera in .storybook/assets/card (servita da /card/<id>.png) */
export const CARD_PET_ID = ({ pets: 1, moto: 2001, furry: 3001 } as Record<string, number>)[site.id] ?? 1
