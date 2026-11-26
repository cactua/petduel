import { and, eq, sql } from 'drizzle-orm'
import satori from 'satori'
import sharp from 'sharp'
import { Resvg } from '@resvg/resvg-js'
import site from '#site'
import siteIt from '#site-it'
import { siteBrand } from '#shared/site'
import { PET_ART, TOP_RANK, type Species } from '#shared/models'
import { speciesName } from '#shared/speciesNames'
import { pets, users } from '../db/schema'
import { useDb } from './db'
import { aheadOf, coverImage, hasApprovedPhoto } from './pets'
import { challengeStatus, getChallenge, loadStandings, loadTrophies } from './challenges'

export const CARD_FORMATS = {
  story: { width: 1080, height: 1920 }, // storie Instagram, WhatsApp, TikTok
  og: { width: 1200, height: 630 }, // anteprima del link nelle chat e sui social
} as const
export type CardFormat = keyof typeof CARD_FORMATS

// Colori e mascotte del sito (site.config.ts, o quelli del nucleo se il sito non li cambia)
const brand = siteBrand(site)
const C = { coral: brand.accent, cream: brand.background, ink: brand.ink, muted: brand.muted, sun: '#ffc83d', white: '#ffffff', glow: brand.glow }
const [BLOB_1, BLOB_2, BLOB_3] = brand.blobs

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

const PAW_ICON = (fill: string) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="${fill}"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6" cy="9.5" r="2.2"/><circle cx="9.8" cy="6" r="2.2"/><circle cx="14.2" cy="6" r="2.2"/><circle cx="18" cy="9.5" r="2.2"/></g></svg>`)

const MASCOT = brand.mascotSvg ? svgUri(brand.mascotSvg) : null
// La domanda dei duelli del sito (le card sono in italiano)
const QUESTION: string = siteIt.duel.question

// Orecchie della specie (come PetEars.vue): forma, proporzioni e posizione rispetto alla cornice, in unità di "s"
interface Ear { svg: string, w: number, h: number, top: number, inset: number, rot: number, pair: boolean }
const ear = (viewBox: string, body: string) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)
const roundEar = (fill: string) => ear('0 0 40 40', `<circle cx="20" cy="20" r="18" fill="${fill}"/><circle cx="20" cy="21" r="10" fill="#ffc2c8"/>`)
const EARS: Record<Species, Ear> = {
  dog: { svg: ear('0 0 46 70', '<path d="M23 3C39 3 45 20 42 43c-2 17-11 24-20 24C11 67 4 57 4 40 4 18 9 3 23 3z" fill="#c99366"/>'), w: 1, h: 1.52, top: -0.22, inset: -0.28, rot: 14, pair: true },
  cat: { svg: ear('0 0 52 46', '<path d="M4 44 18 6c2-4 6-5 9-1l22 36z" fill="#ffc2d1"/><path d="M15 38 22 15l13 22z" fill="#ff9fb6"/>'), w: 1.12, h: 1, top: -0.66, inset: 0.5, rot: -12, pair: true },
  rabbit: { svg: ear('0 0 40 80', '<path d="M20 78C6 78 2 52 3 32 4 12 11 2 20 2s16 10 17 30c1 20-3 46-17 46z" fill="#f6e1ea"/><path d="M20 70c-6 0-9-20-8-36 1-14 4-24 8-24s7 10 8 24c1 16-2 36-8 36z" fill="#ffb3c8"/>'), w: 0.8, h: 1.6, top: -1.3, inset: 0.8, rot: -10, pair: true },
  rodent: { svg: roundEar('#e8b98a'), w: 0.78, h: 0.78, top: -0.4, inset: 0.45, rot: 0, pair: true },
  other: { svg: roundEar('#d8c6b4'), w: 0.78, h: 0.78, top: -0.4, inset: 0.45, rot: 0, pair: true },
  bird: { svg: ear('0 0 50 50', '<g fill="#8fd3a8"><ellipse cx="14" cy="34" rx="5.5" ry="14" transform="rotate(-32 14 34)"/><ellipse cx="36" cy="34" rx="5.5" ry="14" transform="rotate(32 36 34)"/><ellipse cx="25" cy="28" rx="6.5" ry="19"/></g>'), w: 1, h: 1, top: -0.86, inset: 0, rot: 0, pair: false },
  reptile: { svg: ear('0 0 80 30', '<path d="M2 30 12 6l10 24 9-28 9 28 9-28 9 28 10-24 10 24z" fill="#9fd68a"/>'), w: 1.7, h: 0.62, top: -0.5, inset: 0, rot: 0, pair: false },
}

// Medaglietta del collare, colorata per specie (come in DuelArena.vue)
const MEDAL: Record<Species, string> = { dog: '#ffc83d', cat: '#b9a4ff', rabbit: '#ff9fb6', rodent: '#f5a65b', bird: '#6cc68f', reptile: '#8cc56a', other: '#7cc3f0' }

// Coccarde come PetRosette.vue; il numero lo scrive satori sopra, con il font della card
const ROSETTE_COLORS = {
  1: { petals: '#ffc83d', center: '#ffe08a', edge: '#e9a400', tails: '#e2493a' },
  2: { petals: '#cfd8e3', center: '#eef2f7', edge: '#9aa8b8', tails: '#5b8def' },
  3: { petals: '#eab98f', center: '#f7dcc2', edge: '#b9773f', tails: '#2ec4a0' },
} as const
const ROSETTES = Object.fromEntries(Object.entries(ROSETTE_COLORS).map(([place, c]) => [place, svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52"><path d="M12 30 6 50l8-4 4 6 4-18zM28 30l6 20-8-4-4 6-4-18z" fill="${c.tails}"/><circle cx="20" cy="18" r="17" fill="${c.petals}"/><circle cx="20" cy="18" r="12" fill="${c.center}" stroke="${c.edge}" stroke-width="2" stroke-dasharray="3 2.4"/></svg>`,
)])) as Record<1 | 2 | 3, string>

interface CardData {
  name: string
  species: Species
  breed: string | null
  city: string | null
  owner: string
  wins: number
  speciesRank: number | null
  image: string
  badge: { text: string, trophy: boolean } | null
  cta: string
}

/** Dati pubblici della card: solo pet con almeno una foto approvata. `slug`: sfida a cui riferire la card. */
async function loadCardData(petId: number, slug?: string): Promise<CardData> {
  const db = await useDb()
  const [row] = await db.select({ pet: pets, owner: users.username, image: coverImage })
    .from(pets).innerJoin(users, eq(users.id, pets.ownerId))
    .where(and(eq(pets.id, petId), hasApprovedPhoto))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'errors.petNotFound' })
  const { pet } = row

  const [[ahead], trophies] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(pets)
      .where(and(eq(pets.species, pet.species), aheadOf(pet), hasApprovedPhoto, inRankings)),
    loadTrophies([pet.id]),
  ])

  let image = row.image
  let badge: CardData['badge'] = null
  let cta = 'Votalo su'

  // Card legata a una sfida: foto e posizione di quella sfida
  const challenge = slug ? await getChallenge(slug).catch(() => null) : null
  const standing = challenge && (await loadStandings(challenge.id, 1000)).find(s => s.id === pet.id)
  if (challenge && standing) {
    image = standing.image.replace(/^\/img\//, '')
    const status = challengeStatus(challenge)
    // La posizione si scrive solo nella top
    const inTop = standing.rank <= TOP_RANK && standing.score > 0
    if (status === 'ended') {
      badge = standing.rank === 1
        ? { text: `Ha vinto «${challenge.title}»`, trophy: true }
        : { text: inTop ? `${standing.rank}° nella sfida «${challenge.title}»` : `Ha partecipato a «${challenge.title}»`, trophy: false }
    }
    else if (status === 'active') {
      badge = { text: inTop ? `${standing.rank}° nella sfida «${challenge.title}»` : `In gara nella sfida «${challenge.title}»`, trophy: false }
      cta = 'Votalo nella sfida su'
    }
    else {
      badge = { text: `In gara nella sfida «${challenge.title}»`, trophy: false }
    }
  }
  else {
    const latest = trophies.get(pet.id)?.[0]
    if (latest) badge = { text: `Ha vinto «${latest.title}»`, trophy: true }
  }

  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    city: pet.city,
    owner: row.owner,
    wins: pet.wins,
    // Solo una posizione da vantarsi: fuori dalla top non si scrive
    speciesRank: pet.hideFromRankings || !pet.wins || (ahead?.count ?? 0) + 1 > TOP_RANK ? null : (ahead?.count ?? 0) + 1,
    image,
    badge,
    cta,
  }
}


let fonts: Promise<{ name: string, data: Buffer, weight: 600 | 700 | 800 }[]> | undefined
function loadFonts() {
  fonts ??= Promise.all(([
    ['Fredoka', 'fredoka-latin-600-normal.woff', 600],
    ['Nunito', 'nunito-latin-700-normal.woff', 700],
    ['Nunito', 'nunito-latin-800-normal.woff', 800],
  ] as const).map(async ([name, file, weight]) => {
    const raw = await useStorage('assets:core').getItemRaw(`fonts:${file}`)
    if (!raw) throw new Error(`Font mancante: ${file}`)
    return { name, data: Buffer.from(raw), weight }
  }))
  return fonts
}

// Le card usano il ritaglio quadrato scelto da chi ha caricato la foto (quasi quadrate anche loro)
async function photoDataUri(image: string, width: number, height: number) {
  const raw = await ensureVariant(image, 's', 1080, 'webp') ?? await useStorage('uploads').getItemRaw(image)
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })
  const jpeg = await sharp(Buffer.from(raw)).resize(width, height, { fit: 'cover' }).jpeg({ quality: 84 }).toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

// Satori vuole display:flex su ogni contenitore con più figli
type Node = { type: string, props: Record<string, unknown> }
const box = (style: Record<string, unknown>, ...children: (Node | string | null | false)[]): Node =>
  ({ type: 'div', props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) } })
const img = (src: string, style: Record<string, unknown>): Node =>
  ({ type: 'img', props: { src, width: style.width, height: style.height, style } })

function nameSize(name: string, base: number) {
  if (name.length <= 10) return base
  if (name.length <= 16) return base * 0.8
  if (name.length <= 24) return base * 0.62
  return base * 0.48
}

// Coccarda sul collare: oro per chi ha vinto una sfida, altrimenti il podio della specie
function rosette(d: CardData, width: number) {
  const place = d.badge?.trophy ? 1 : d.speciesRank && d.speciesRank <= 3 ? d.speciesRank as 1 | 2 | 3 : null
  if (!place) return null
  const height = width * 1.3
  return box({ position: 'relative', flexShrink: 0, width, height, transform: 'rotate(8deg)' },
    img(ROSETTES[place], { position: 'absolute', left: 0, top: 0, width, height }),
    box({
      position: 'absolute', left: 0, top: width * 0.1, width, height: width * 0.7, alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka', fontSize: width * 0.36, color: ROSETTE_COLORS[place].edge,
    }, String(place)))
}

function ears(species: Species, s: number): Node[] {
  const e = PET_ART ? EARS[species] : undefined
  if (!e) return []
  const w = e.w * s
  const h = e.h * s
  if (!e.pair) return [box({ position: 'absolute', top: e.top * s, left: 0, right: 0, justifyContent: 'center' }, img(e.svg, { width: w, height: h }))]
  return [
    img(e.svg, { position: 'absolute', top: e.top * s, left: e.inset * s, width: w, height: h, transform: `rotate(${e.rot}deg)` }),
    img(e.svg, { position: 'absolute', top: e.top * s, right: e.inset * s, width: w, height: h, transform: `rotate(${-e.rot}deg) scaleX(-1)` }),
  ]
}

// Cornice morbida con orecchie e collare (medaglietta, nome, razza, coccarda o cuori). u: unità di misura
function framed(d: CardData, photo: string, p: { width: number, height: number }, u: number, earSize: number) {
  return box({
    position: 'relative', flexDirection: 'column', flexShrink: 0, padding: `${u}px ${u}px 0`,
    background: C.white, borderRadius: u * 3.8, boxShadow: `0 ${u * 2}px ${u * 4}px -${u * 2}px ${C.glow}`,
  },
  img(photo, { ...p, borderRadius: u * 2.9, objectFit: 'cover' }),
  box({ alignItems: 'center', gap: u, padding: `${u * 0.9}px ${u}px ${u}px ${u * 0.4}px` },
    box({ width: u * 4.6, height: u * 4.6, flexShrink: 0, borderRadius: 999, background: (PET_ART && MEDAL[d.species]) || C.coral, alignItems: 'center', justifyContent: 'center' },
      img(PAW_ICON(C.white), { width: u * 2.5, height: u * 2.5 })),
    box({ flex: 1, flexDirection: 'column', minWidth: 0 },
      box({ fontFamily: 'Fredoka', fontSize: nameSize(d.name, u * 5.4), lineHeight: 1.05 }, d.name),
      box({ fontSize: u * 2.1, fontWeight: 800, color: C.muted }, [d.breed || speciesName(d.species, 'one'), d.city].filter(Boolean).join(' · '))),
    rosette(d, u * 5)),
  ...ears(d.species, earSize))
}

// Bigliettini: sfida (in giallo) e posizione nella specie con i cuori, solo se è nella top
function facts(d: CardData, size: number, align: 'center' | 'flex-start') {
  const pill = (text: string, background: string) => box({
    background, color: C.ink, fontWeight: 800, fontSize: size,
    padding: `${size * 0.32}px ${size * 0.75}px`, borderRadius: 999,
  }, text)
  return box({ gap: size * 0.45, flexWrap: 'wrap', justifyContent: align },
    d.badge && pill(d.badge.text, C.sun),
    !!d.speciesRank && pill(`${d.speciesRank}° ${speciesName(d.species, 'among')} · ${d.wins} ${d.wins === 1 ? 'cuore' : 'cuori'}`, C.white))
}

const logo = (size: number) => box({ alignItems: 'center', gap: size * 0.2, fontFamily: 'Fredoka', fontSize: size, color: C.coral },
  img(PAW_ICON(C.coral), { width: size * 0.9, height: size * 0.9, transform: 'rotate(-14deg)' }), site.name)

// La mascotte che fa la domanda in un fumetto; senza mascotte resta il fumetto, senza punta
const ask = (size: number) => box({ alignItems: 'flex-end', gap: size * 0.2 },
  !!MASCOT && img(MASCOT, { width: size * 2.6, height: size * 2.35 }),
  box({
    marginBottom: MASCOT ? size * 0.5 : 0, background: C.white, padding: `${size * 0.3}px ${size * 0.65}px`, fontFamily: 'Fredoka', fontSize: size,
    borderRadius: MASCOT ? `${size}px ${size}px ${size}px ${size * 0.2}px` : size, boxShadow: `0 ${size * 0.3}px ${size * 0.7}px -${size * 0.45}px rgba(74,45,30,.5)`,
  }, QUESTION))

const cta = (text: string, size: number) => box({
  background: C.coral, color: C.white, fontFamily: 'Fredoka', fontSize: size, padding: `${size * 0.38}px ${size * 0.9}px`,
  borderRadius: 999, boxShadow: `0 ${size * 0.3}px ${size * 0.6}px -${size * 0.25}px ${C.glow}`,
}, text)

// Macchie pastello dello sfondo
const blob = (x: number, y: number, r: number, color: string) =>
  box({ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 999, background: color })

// Con il badge la foto della storia cede un po' di spazio ai bigliettini
const storyPhoto = (d: CardData) => ({ width: 856, height: d.badge ? 880 : 960 })

// Sfondo chiaro con macchie pastello; il contenuto sta in un livello sopra (in satori gli elementi posizionati coprono gli altri)
function page(blobs: Node[], content: Record<string, unknown>, ...children: (Node | string | null | false)[]): Node {
  return box({ position: 'relative', width: '100%', height: '100%', background: C.cream, fontFamily: 'Nunito', color: C.ink },
    ...blobs,
    box({ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', boxSizing: 'border-box', ...content }, ...children))
}

function storyLayout(d: CardData, photo: string, host: string): Node {
  return page(
    [blob(70, 90, 250, BLOB_1), blob(1060, 980, 300, BLOB_2), blob(40, 1800, 280, BLOB_3)],
    { flexDirection: 'column', alignItems: 'center', gap: 36, padding: '76px 80px 90px' },
    box({ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' },
      logo(64),
      box({ fontSize: 32, fontWeight: 800, color: C.muted }, `@${d.owner}`)),
    box({ alignSelf: 'stretch' }, ask(56)),
    box({ marginTop: 40 }, framed(d, photo, storyPhoto(d), 16, 116)),
    facts(d, 32, 'center'),
    box({ marginTop: 'auto' }, cta(`${d.cta} ${host}`, 50)),
  )
}

function ogLayout(d: CardData, photo: string, host: string): Node {
  return page(
    [blob(40, 40, 170, BLOB_1), blob(1180, 330, 200, BLOB_2), blob(560, 660, 150, BLOB_3)],
    { alignItems: 'center', gap: 56, padding: '40px 56px 20px 80px' },
    framed(d, photo, { width: 360, height: 380 }, 10, 64),
    box({ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 22 },
      logo(40),
      ask(36),
      facts(d, 22, 'flex-start'),
      cta(`${d.cta} ${host}`, 30)),
  )
}

// Le card costano ~100-300 ms: le teniamo in memoria. La chiave contiene i dati, quindi non diventa mai vecchia.
const cache = new Map<string, Buffer>()
const CACHE_MAX = 200

export async function renderPetCard(petId: number, format: CardFormat, host: string, slug?: string) {
  const data = await loadCardData(petId, slug)
  const key = JSON.stringify([petId, format, host, data])
  const hit = cache.get(key)
  if (hit) return hit

  const { width, height } = CARD_FORMATS[format]
  const p = format === 'story' ? storyPhoto(data) : { width: 360, height: 380 }
  const photo = await photoDataUri(data.image, p.width, p.height)
  const tree = format === 'story' ? storyLayout(data, photo, host) : ogLayout(data, photo, host)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(tree as any, { width, height, fonts: await loadFonts() })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(key, png)
  return png
}

// ── Anteprime dei link per la home (e le pagine senza un'immagine propria) e per le sfide ──

/** Una foto in cornice bianca, senza collare: per le card con più soggetti */
const snapshot = (photo: string, w: number, h: number, u: number, rot = 0) => box({
  flexShrink: 0, padding: u, background: C.white, borderRadius: u * 3.6, transform: `rotate(${rot}deg)`,
  boxShadow: `0 ${u * 2}px ${u * 4}px -${u * 2}px ${C.glow}`,
}, img(photo, { width: w, height: h, borderRadius: u * 2.6, objectFit: 'cover' }))

const vsPatch = (size: number) => box({
  width: size, height: size, borderRadius: 999, background: C.coral, border: `${size * 0.07}px solid ${C.white}`,
  alignItems: 'center', justifyContent: 'center', color: C.white, fontFamily: 'Fredoka', fontSize: size * 0.34, transform: 'rotate(-10deg)',
}, 'VS')

async function renderTree(tree: Node, key: string) {
  const hit = cache.get(key)
  if (hit) return hit
  const { width, height } = CARD_FORMATS.og
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(tree as any, { width, height, fonts: await loadFonts() })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(key, png)
  return png
}

const OG_BLOBS = () => [blob(40, 40, 170, BLOB_1), blob(1180, 330, 200, BLOB_2), blob(560, 660, 150, BLOB_3)]

/** Card del sito: la domanda dei duelli con i due partecipanti con più cuori, uno contro l'altro */
export async function renderSiteCard(host: string) {
  const db = await useDb()
  // Due foto diverse (la stessa immagine caricata per due personaggi non fa un duello)
  // Il join fa scrivere a drizzle "pets"."id" per intero: senza, dentro coverImage "id" sarebbe quello delle foto
  const rows = await db.select({ id: pets.id, wins: pets.wins, image: coverImage }).from(pets)
    .innerJoin(users, eq(users.id, pets.ownerId))
    .where(and(hasApprovedPhoto, inRankings))
    .orderBy(sql`${pets.wins} desc`, pets.id)
    .limit(8)
  const top = rows.filter((r, i) => rows.findIndex(o => o.image === r.image) === i).slice(0, 2)
  const key = JSON.stringify(['site', host, top])
  const cached = cache.get(key)
  if (cached) return cached

  const photos = await Promise.all(top.map(p => photoDataUri(p.image, 270, 320)))
  const duel = photos.length === 2
    ? box({ position: 'relative', alignItems: 'center', gap: 30, flexShrink: 0 },
        snapshot(photos[0]!, 270, 320, 10, -4),
        snapshot(photos[1]!, 270, 320, 10, 4),
        box({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, vsPatch(92)))
    : null

  return renderTree(page(
    OG_BLOBS(),
    { alignItems: 'center', gap: 40, padding: '40px 50px 30px 64px' },
    box({ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 26, minWidth: 0 },
      logo(52),
      ask(38),
      cta(`Vota su ${host}`, 30)),
    duel,
  ), key)
}

/** Card di una sfida: titolo, stato e i primi tre (o il vincitore) */
export async function renderChallengeCard(slug: string, host: string) {
  const challenge = await getChallenge(slug)
  const status = challengeStatus(challenge)
  const top = status === 'upcoming' ? [] : (await loadStandings(challenge.id, 3)).filter(s => s.score > 0 || status === 'active')
  const key = JSON.stringify(['challenge', host, challenge.id, challenge.title, status, top.map(s => [s.id, s.image, s.score])])
  const cached = cache.get(key)
  if (cached) return cached

  const winner = status === 'ended' ? top[0] : undefined
  const label = status === 'upcoming' ? 'Sfida in arrivo' : status === 'active' ? 'Sfida in corso' : winner ? `Ha vinto ${winner.name}` : 'Sfida conclusa'
  const action = status === 'active' ? 'Vota su' : status === 'upcoming' ? 'Partecipa su' : 'Guarda su'

  const shots = await Promise.all((winner ? [winner] : top).map(s => photoDataUri(s.image.replace(/^\/img\//, ''), winner ? 340 : 230, winner ? 380 : 270)))
  const ROT = [-6, 3, 8]
  const pictures = shots.length
    ? box({ alignItems: 'center' }, ...shots.map((p, i) => box({ marginLeft: i ? -60 : 0 }, snapshot(p, winner ? 340 : 230, winner ? 380 : 270, 9, winner ? 3 : ROT[i]!))))
    // Nessuna foto ancora: la coccarda d'oro (satori non ha un font per le emoji del tema)
    : box({ width: 300, height: 300, borderRadius: 999, background: C.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        img(ROSETTES[1], { width: 160, height: 208, transform: 'rotate(8deg)' }))

  return renderTree(page(
    OG_BLOBS(),
    { alignItems: 'center', gap: 44, padding: '40px 60px 30px 70px' },
    box({ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 22, minWidth: 0 },
      logo(40),
      box({ background: C.sun, color: C.ink, fontWeight: 800, fontSize: 24, padding: '6px 18px', borderRadius: 999 }, label),
      box({ fontFamily: 'Fredoka', fontSize: nameSize(challenge.title, 62), lineHeight: 1.1 }, challenge.title),
      cta(`${action} ${host}`, 28)),
    pictures,
  ), key)
}
