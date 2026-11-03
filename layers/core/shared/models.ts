import { z } from 'zod'
import site from '#site'
import siteIt from '#site-it'
import type { Badge } from './badges'

// Categorie del sito (per PetDuel le specie). Se il sito non ne ha, ogni contenuto ha categoria "" e competono tutti insieme
export const SPECIES = site.categories.map(c => c.id)
export type Species = string
export const NO_SPECIES = ''

const pick = (key: 'slug' | 'emoji') =>
  Object.fromEntries(site.categories.map(c => [c.id, c[key]])) as Record<Species, string>

export const SPECIES_SLUG = pick('slug')
export const SPECIES_EMOJI = pick('emoji')

// Classifica di una categoria; i siti senza categorie (es. furry) hanno solo quella generale
export const rankingPath = (s: Species | null | undefined) => (s && SPECIES_SLUG[s] ? `/leaderboard/${SPECIES_SLUG[s]}` : '/leaderboard')

// "/leaderboard/cats" -> "gatto"
export const speciesFromSlug = (slug: unknown) =>
  site.categories.find(c => c.slug === slug)?.id

// Categoria valida per questo sito ("" se il sito non ha categorie)
export const speciesSchema = SPECIES.length
  ? z.enum(SPECIES as [Species, ...Species[]])
  : z.literal(NO_SPECIES).default(NO_SPECIES)
// Filtro facoltativo per categoria (duelli, classifiche, adozioni)
export const speciesFilterSchema = z.enum(SPECIES as [Species, ...Species[]]).optional()

// Classifica settimanale e mensile: si azzerano lunedì e il primo del mese (ora italiana)
// "nuovi": tutti i cuori, ma solo dei partecipanti arrivati da NEW_TALENT_DAYS giorni
export const PERIODS = ['week', 'month', 'all', 'new'] as const
export const NEW_TALENT_DAYS = 30
export type Period = (typeof PERIODS)[number]

export const PERIOD_LABEL: Record<Period, string> = {
  week: 'Settimana',
  month: 'Mese',
  all: 'Di sempre',
  new: 'Nuovi talenti',
}

// Peso del voto di chi non ha un account (il server lo applica, il sito lo racconta)
export const ANON_VOTE_WEIGHT = 0.25
/** Voto di un account creato da pochi giorni (server/utils/voter.ts) */
export const NEW_ACCOUNT_VOTE_WEIGHT = 0.5

export const PHOTO_STATUS =['pending', 'approved', 'rejected'] as const
export type PhotoStatus = (typeof PHOTO_STATUS)[number]

// Motivi di rifiuto di un'immagine, in italiano come li sceglie il moderatore e come restano nel database.
// Ogni sito può avere i suoi ("reasons" nel suo i18n/locales/it.json); l'ultimo è sempre quello delle sfide
export const REJECT_REASONS = siteIt.reasons as [string, ...string[]]
export const CHALLENGE_REJECT_REASON = REJECT_REASONS[REJECT_REASONS.length - 1]!

// Regole condivise tra form (client) e API (server), così i messaggi coincidono
const text = (max: number) => z.string().trim().max(max)

export const emailSchema = z.string().trim().toLowerCase().max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'validation.email')
export const usernameSchema = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'validation.username')
export const passwordSchema = z.string()
  .min(10, 'validation.passwordMin')
  .max(128, 'validation.passwordMax')

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
})
/** Iscrizione dal sito: in più va accettato il regolamento della community (/rules) */
export const signupSchema = registerSchema.extend({
  rules: z.boolean().refine(v => v, 'validation.rules'),
})
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})
/** Razza e città si chiedono solo se il sito le usa (breedAndCity in site.config.ts) */
export const HAS_BREED_CITY = site.breedAndCity !== false
// Dove non si usano restano sempre vuote, qualunque cosa arrivi
const breedCity = HAS_BREED_CITY ? text(40).default('') : z.unknown().transform(() => '')

export const petFieldsSchema = z.object({
  name: text(40).min(1, 'validation.petName'),
  species: speciesSchema,
  breed: breedCity,
  city: breedCity,
})

/**
 * Autore e licenza di una foto non scattata dal proprietario (es. Wikimedia Commons).
 * Per un artista registrato url è il suo profilo sul sito ("/u/…"): i link inseriti a mano sono sempre http/https
 */
export interface PhotoCredit {
  text: string
  url: string | null
}

export interface PublicPet {
  id: number
  name: string
  species: Species
  breed: string
  city: string
  image: string
  credit?: PhotoCredit | null
  // Foto mostrata nel duello, per poterla segnalare
  photoId?: number
  owner: string
  // Solo per i pet dei rifugi verificati
  adoption?: AdoptionStatus | null
}

// In classifica si mostrano solo i primi: chi è più indietro non viene esposto (brutto per i proprietari)
export const TOP_RANK = 5

export interface RankedPet extends PublicPet {
  rank: number
  // Posizione tra i pet della sua specie (classifica generale)
  speciesRank?: number
  // Cuori ricevuti nel periodo ("sempre": tutti)
  score: number
}

export interface Leaderboard {
  period: Period
  species: Species | null
  city: string | null
  resetsAt: string | null
  top: RankedPet[]
  // Classifica generale: la top della specie per ogni specie che ha pet in gara
  bySpecies: { species: Species, top: RankedPet[] }[]
  // Pet dell'utente collegato fuori dalla top, con i cuori che mancano per entrare in quella della sua specie
  mine: (RankedPet & { toTop: number })[]
}

export interface Duel {
  pets: [PublicPet, PublicPet] | null
  token: string | null
}

export interface PetPhoto {
  id: number
  image: string
  status: PhotoStatus
  rejectReason: string | null
  credit: PhotoCredit | null
  createdAt: string
}

export interface PetGallery extends Omit<PublicPet, 'image'> {
  // Cuori ricevuti (un voto contato = un cuore, non si perdono mai): arrivano solo al proprietario.
  // L'Elo resta sul server e serve solo ad abbinare i duelli
  wins?: number
  // Traguardi raggiunti (pubblici: sono solo cose belle)
  badges: Badge[]
  photos: PetPhoto[]
  trophies: Trophy[]
  adoptionInfo?: PetAdoption | null
}

// --- Sfide settimanali a tema ---

export type ChallengeStatus = 'upcoming' | 'active' | 'ended'

export interface ChallengeSummary {
  id: number
  slug: string
  title: string
  description: string
  emoji: string
  // null = aperta a tutte le specie
  species: Species | null
  startsAt: string
  endsAt: string
  status: ChallengeStatus
  entries: number
  winner: { petId: number, name: string, image: string, owner: string } | null
  // Primi tre di una sfida in corso (vuoto per le altre)
  leaders: { petId: number, name: string, image: string }[]
  // Sfida riservata ai pet dei rifugi che cercano casa
  adoptionOnly: boolean
}

export interface ChallengeStanding extends RankedPet {
  entryId: number
}

export interface MyChallengeEntry {
  entryId: number
  petId: number
  petName: string
  image: string
  status: PhotoStatus
}

export interface ChallengeDetail extends ChallengeSummary {
  standings: ChallengeStanding[]
  myEntries: MyChallengeEntry[]
}

export interface ChallengeList {
  current: ChallengeSummary[]
  upcoming: ChallengeSummary[]
  past: ChallengeSummary[]
}

export interface Trophy {
  slug: string
  title: string
  emoji: string
  endsAt: string
}

export const challengeFieldsSchema = z.object({
  title: text(60).min(3, 'Titolo troppo corto'),
  description: text(200).min(3, 'Aggiungi una descrizione'),
  emoji: text(16).min(1, 'Scegli un\'emoji'),
  species: z.enum(SPECIES as [Species, ...Species[]]).nullable().default(null),
  adoptionOnly: z.boolean().default(false),
  // Data di inizio (YYYY-MM-DD): la sfida dura 7 giorni da mezzanotte, ora italiana
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
})

export interface Profile {
  username: string
  memberSince: string
  isMe: boolean
  // Rifugio verificato gestito da questo utente, con quanti ospiti cercano casa
  shelter: PublicShelter | null
  // Duelli votati da quando ha l'account
  votes: number
  pets: PetGallery[]
  // Solo sul proprio profilo: il rifugio che si gestisce, in qualsiasi stato
  manage: ShelterManage | null
  // Chi si è segnato come artista (siti con askCredit), con le sue pagine social
  artist: { links: string[], commissions: CommissionStatus, commissionsUrl: string } | null
  // Immagini pubblicate da altri che lo indicano come artista, le più recenti
  artworks: Artwork[]
  // L'hai bloccato tu (solo per chi è collegato)
  blocked: boolean
  // Lo segui tu (solo per chi è collegato)
  following: boolean
  // Quanti lo seguono: solo sul proprio profilo
  followers: number | null
}

// Un lavoro nuovo di chi segui: caricato da lui o che lo indica come artista
export interface FollowedWork {
  photoId: number
  petId: number
  name: string
  image: string
  owner: string
  credit: PhotoCredit | null
  // Chi segui, tra proprietario e artista
  via: string
  createdAt: string
}

export interface FavoritePet {
  id: number
  name: string
  image: string
  owner: string
  credit: PhotoCredit | null
}

export interface Artwork {
  photoId: number
  petId: number
  name: string
  image: string
}

/** Rifugio di chi è collegato, per le scorciatoie (profilo, menu) */
export interface ShelterManage {
  status: ShelterStatus
  slug: string
  name: string
  newRequests: number
}

export interface ModerationItem {
  id: number
  image: string
  createdAt: string
  pet: { id: number, name: string, species: Species, approvedPhotos: number }
  owner: string
  // Titolo della sfida se la foto è stata inviata per una sfida (va controllato che sia in tema)
  challenge: string | null
  // Artista indicato da chi carica (siti con askCredit): va controllato che il link sia pulito
  credit: PhotoCredit | null
}

// --- Avvisi per il proprietario ---

export interface AppNotification {
  id: number
  emoji: string
  text: string
  link: string | null
  read: boolean
  createdAt: string
  // Con i parametri "text" è una chiave di traduzione (notif.*); senza, è il testo già scritto
  params?: Record<string, string | number> | null
}

export interface NotificationList {
  items: AppNotification[]
  unread: number
}

// --- Rifugi, canili e associazioni ---

// Stato di adozione di un pet di un rifugio verificato (null = pet di un privato)
export const ADOPTION_STATUS = ['available', 'fostered', 'adopted'] as const
export type AdoptionStatus = (typeof ADOPTION_STATUS)[number]
export const ADOPTION_LABEL: Record<AdoptionStatus, string> = {
  available: 'Cerca casa',
  fostered: 'In affido',
  adopted: 'Adottato!',
}

export const PET_SEX = ['m', 'f'] as const
export const PET_SIZE = ['piccola', 'media', 'grande'] as const
export type PetSize = (typeof PET_SIZE)[number]

/** Un partecipante che hai scelto in un duello (pagina "Votati da te"), il voto più recente prima */
export interface VotedPet {
  id: number
  name: string
  image: string
  owner: string
  credit: PhotoCredit | null
  votedAt: string
  // Se l'ultimo voto era in una sfida
  challenge: { slug: string, title: string } | null
}

// --- Complimenti ---

/** Complimenti già pronti; testi in compliments.<id> (ogni sito li adatta) */
export const COMPLIMENTS = ['love', 'style', 'colors', 'expression', 'idea'] as const
export type ComplimentKind = (typeof COMPLIMENTS)[number]
export const COMPLIMENT_EMOJI: Record<ComplimentKind, string> = { love: '😍', style: '✨', colors: '🎨', expression: '😊', idea: '💡' }

/** Complimenti di un partecipante: i propri sempre, i conteggi solo per proprietario e artista */
export interface PetCompliments {
  mine: ComplimentKind[]
  counts: Partial<Record<ComplimentKind, number>> | null
  // Si possono fare (collegati, non il proprietario, non bloccati)
  canGive: boolean
}

// --- Segnalazioni ---

/** Raffica di voti dalla stessa rete per un partecipante (coda admin) */
export interface VoteAlert {
  id: number
  petId: number
  name: string
  owner: string
  image: string | null
  // Voti di una sfida invece dei duelli generali
  challenge: boolean
  hits: number
  day: string
}

/** Motivi per segnalare un'immagine pubblicata; testi in report.reason.<id> */
export const PHOTO_REPORT_REASONS = ['stolen', 'ai', 'explicit', 'hateful', 'personal', 'other'] as const
/** Motivi per segnalare un profilo (nome, link da artista) */
export const USER_REPORT_REASONS = ['hateful', 'spam', 'impersonation', 'other'] as const
export type ReportReason = (typeof PHOTO_REPORT_REASONS)[number] | (typeof USER_REPORT_REASONS)[number]
export type ReportStatus = 'open' | 'resolved' | 'dismissed'

export const reportSchema = z.discriminatedUnion('target', [
  z.object({ target: z.literal('photo'), id: z.number().int().positive(), reason: z.enum(PHOTO_REPORT_REASONS), note: text(300).default('') }),
  z.object({ target: z.literal('user'), username: z.string().trim().toLowerCase().max(30), reason: z.enum(USER_REPORT_REASONS), note: text(300).default('') }),
])
export type ReportInput = z.input<typeof reportSchema>

/** Una cosa segnalata, con tutte le segnalazioni aperte su di lei (coda dei moderatori) */
export interface ReportGroup {
  target: 'photo' | 'user'
  // Id della foto o dell'utente segnalato
  id: number
  photo: { image: string, petId: number, petName: string, owner: string, credit: PhotoCredit | null } | null
  user: { username: string, banned: boolean, artistLinks: string[] } | null
  reports: { reason: ReportReason, note: string, reporter: string, createdAt: string, byArtist: boolean }[]
}

export const SHELTER_STATUS = ['pending', 'approved', 'rejected'] as const
export type ShelterStatus = (typeof SHELTER_STATUS)[number]

const optionalUrl = z.string().trim().max(200)
  .refine(v => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), 'validation.website')
  .default('')

/** Artista di un'immagine caricata, sui siti che lo chiedono (askCredit in site.config.ts): nome e, se c'è, la sua pagina */
export const photoCreditSchema = z.object({
  credit: text(60).default(''),
  creditUrl: optionalUrl,
  // In alternativa: un artista registrato, scelto dalla ricerca (vince su nome e link)
  artist: z.string().trim().max(30).default(''),
})

/** Profilo da artista: chi carica un disegno lo può cercare e indicare come autore. Solo dove c'è askCredit */
export const HAS_ARTISTS = !!site.askCredit

// Pagina di un partecipante: /pet/<id> sul sito degli animali, /character/<id> sul furry (site.entryPath)
export const ENTRY_PATH = site.entryPath ?? 'pet'
export const entryUrl = (id: number | string) => `/${ENTRY_PATH}/${id}`
export const MAX_ARTIST_LINKS = 6

export const COMMISSION_STATUSES = ['', 'open', 'closed'] as const
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number]

export const artistSettingsSchema = z.object({
  isArtist: z.boolean(),
  links: z.array(optionalUrl.refine(v => !!v, 'validation.website')).max(MAX_ARTIST_LINKS),
  commissions: z.enum(COMMISSION_STATUSES).default(''),
  commissionsUrl: optionalUrl,
})
export type ArtistSettings = z.infer<typeof artistSettingsSchema>

const phoneSchema = z.string().trim().max(30).regex(/^[+\d\s./-]*$/, 'validation.phone').default('')

export const shelterFieldsSchema = z.object({
  name: text(60).min(3, 'validation.shelterName'),
  city: text(40).min(2, 'validation.city'),
  description: text(600).min(20, 'validation.shelterDescription'),
  website: optionalUrl,
  // Solo per la verifica dei moderatori: non compare mai sul sito
  taxCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{11,16}$/, 'validation.taxCode'),
  contactEmail: emailSchema,
  phone: phoneSchema,
})

// --- Pagina del rifugio personalizzata ---

// Colori tra cui scegliere: tutti leggibili, con il tema chiaro e scuro
export const SHELTER_ACCENTS = ['coral', 'sky', 'mint', 'sun', 'lilac', 'forest'] as const
export type ShelterAccent = (typeof SHELTER_ACCENTS)[number]
export const SOCIALS = ['instagram', 'facebook', 'tiktok', 'youtube'] as const
export type Social = (typeof SOCIALS)[number]
export type ShelterSocials = Partial<Record<Social, string>>
export const MAX_NEEDS = 12

const coord = (max: number) => z.number().min(-max).max(max).nullable().default(null)

/** Tutto quello che un rifugio verificato può cambiare da solo (nome, città e codice fiscale no) */
export const shelterProfileSchema = z.object({
  description: shelterFieldsSchema.shape.description,
  tagline: text(90).default(''),
  help: text(800).default(''),
  needs: z.array(text(60).min(1)).max(MAX_NEEDS).default([]),
  accent: z.enum(SHELTER_ACCENTS).default('coral'),
  address: text(140).default(''),
  lat: coord(90),
  lng: coord(180),
  hours: text(300).default(''),
  website: optionalUrl,
  publicEmail: z.union([z.literal(''), emailSchema]).default(''),
  publicPhone: phoneSchema,
  socials: z.object(Object.fromEntries(SOCIALS.map(s => [s, optionalUrl])) as Record<Social, typeof optionalUrl>),
  donateUrl: optionalUrl,
  // IBAN senza spazi: controllo leggero di forma (paese, cifre di controllo, conto)
  iban: z.string().trim().toUpperCase().transform(v => v.replace(/\s+/g, ''))
    .refine(v => !v || /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v), 'validation.iban').default(''),
  // Privati: per i moderatori
  contactEmail: shelterFieldsSchema.shape.contactEmail,
  phone: phoneSchema,
}).refine(p => (p.lat === null) === (p.lng === null), 'validation.check')
export type ShelterProfile = z.infer<typeof shelterProfileSchema>

export const adoptionFieldsSchema = z.object({
  status: z.enum(ADOPTION_STATUS).nullable(),
  sex: z.enum(PET_SEX).nullable().default(null),
  age: text(30).default(''),
  size: z.enum(PET_SIZE).nullable().default(null),
  neutered: z.boolean().nullable().default(null),
  about: text(600).default(''),
  // Fuori da classifiche e sfide: utile per chi non vuole mettere "in gara" un animale in cerca di casa
  hideFromRankings: z.boolean().default(false),
})
export type AdoptionFields = z.infer<typeof adoptionFieldsSchema>

export const adoptionRequestSchema = z.object({
  message: text(1000).min(30, 'validation.adoptionMessage'),
  phone: z.string().trim().max(30).regex(/^[+\d\s./-]*$/, 'validation.phone').default(''),
})

export const REQUEST_STATUS = ['new', 'contacted', 'closed'] as const
export type RequestStatus = (typeof REQUEST_STATUS)[number]

/** Rifugio come lo vede il pubblico: niente codice fiscale né contatti privati */
export interface PublicShelter {
  slug: string
  name: string
  city: string
  description: string
  tagline: string
  website: string
  accent: ShelterAccent
  // Id delle immagini (vedi shelterImageSources)
  logo: string | null
  banner: string | null
  available: number
  adopted: number
}

/** Pagina pubblica: presentazione completa, dove trovarlo, come aiutarlo */
export interface ShelterPage extends PublicShelter, Omit<ShelterProfile, 'contactEmail' | 'phone' | 'socials'> {
  socials: ShelterSocials
  owner: string
  pets: PetGallery[]
}

/** Dati di adozione mostrati sulla pagina del pet */
export interface PetAdoption extends AdoptionFields {
  status: AdoptionStatus
  shelter: { slug: string, name: string, city: string }
}

export interface AdoptionRequestItem {
  id: number
  pet: { id: number, name: string }
  requester: string
  email: string
  phone: string
  message: string
  status: RequestStatus
  createdAt: string
}

export interface MyShelter {
  shelter: (PublicShelter & ShelterProfile & { status: ShelterStatus, rejectReason: string | null, taxCode: string }) | null
  requests: AdoptionRequestItem[]
}

export interface ShelterReviewItem {
  id: number
  slug: string
  name: string
  city: string
  description: string
  website: string
  taxCode: string
  contactEmail: string
  phone: string
  owner: string
  createdAt: string
}

export interface AdoptablePet extends PublicPet {
  adoption: AdoptionStatus
  shelter: { slug: string, name: string }
  // null se il rifugio lo tiene fuori dalle classifiche
  rank: number | null
}

// --- Pannello admin ---

export interface AdminDay {
  day: string
  votes: number
  anonVotes: number
  signups: number
  uploads: number
}

export interface AdminActivity {
  at: string
  emoji: string
  text: string
  link: string | null
}

export interface AdminOverview {
  todo: { photos: number, shelters: number }
  now: { onlineVoters: number, votesLastHour: number }
  today: { votes: number, anonShare: number, signups: number, uploads: number, adViews: number, adClicks: number }
  totals: { users: number, pets: number, photos: number, votes: number }
  activeChallenge: { slug: string, title: string, emoji: string, entries: number, endsAt: string } | null
  days: AdminDay[]
  activity: AdminActivity[]
}

export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  banned: boolean
  createdAt: string
  pets: number
  votes: number
  pendingPhotos: number
  shelter: string | null
}

export interface AdminUserList {
  users: AdminUser[]
  total: number
}

export const adminUserCreateSchema = registerSchema.extend({
  role: z.enum(['user', 'admin']).default('user'),
})

export const adminUserPatchSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  banned: z.boolean().optional(),
  password: passwordSchema.optional(),
})

// --- Pubblicità ---

// Circuito pubblicitario esterno (Google AdSense): spento, solo quando non c'è nessuna campagna nostra
// in onda ("fallback") o insieme alle campagne con il suo peso ("mix")
export const AD_NETWORK_MODES = ['off', 'fallback', 'mix'] as const
export const AD_NETWORK_DEFAULT = { mode: 'off' as const, client: '', slot: '', weight: 1 }
export const adNetworkSchema = z.object({
  mode: z.enum(AD_NETWORK_MODES),
  client: z.string().trim().regex(/^(ca-pub-\d{10,20})?$/, 'Il codice editore è fatto così: ca-pub- seguito da 16 cifre'),
  slot: z.string().trim().regex(/^(\d{5,20})?$/, "L'ID dell'unità pubblicitaria è fatto solo di cifre"),
  weight: z.number().int().min(1).max(10),
}).refine(n => n.mode === 'off' || (n.client && n.slot), "Per attivare Google servono il codice editore e l'ID dell'unità pubblicitaria")
export type AdNetwork = z.infer<typeof adNetworkSchema>

export const AD_SETTINGS_DEFAULT = { every: 15, startAfter: 5, inChallenges: true, network: AD_NETWORK_DEFAULT }
export const adSettingsSchema = z.object({
  // Una pubblicità ogni N voti; 0 = spente
  every: z.number().int().min(0).max(200),
  // Le prime N votazioni di ogni visita sono senza pubblicità
  startAfter: z.number().int().min(0).max(200),
  inChallenges: z.boolean(),
  network: adNetworkSchema.default(AD_NETWORK_DEFAULT),
})
export type AdSettings = z.infer<typeof adSettingsSchema>

const httpUrl = z.string().trim().max(500).url('Link non valido').refine(u => /^https?:\/\//.test(u), 'Il link deve iniziare con http:// o https://')
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida').nullable().default(null)

// --- Pubblico di una campagna: dove, in che lingua, in che duelli, a chi, quando ---
// Lingue del sito (le stesse di nuxt.config.ts)
export const AD_LANGS = ['it', 'en', 'es', 'fr', 'de'] as const
export type AdLang = typeof AD_LANGS[number]

// Zona: cerchio attorno a un punto (una città cercata su OpenStreetMap). La posizione di chi vota
// arriva dall'indirizzo IP: è precisa più o meno alla città, per questo si ragiona in km
export const adPlaceSchema = z.object({
  label: text(120).min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  km: z.number().int().min(1).max(500),
})
export type AdPlace = z.infer<typeof adPlaceSchema>

export const adTargetingSchema = z.object({
  // Paesi (codici ISO a due lettere) e zone: vuoti entrambi = ovunque
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(60).default([]),
  places: z.array(adPlaceSchema).max(20).default([]),
  // Se non si sa dove si trova chi vota (rete che non lo dice): mostrarla lo stesso?
  unknownLocation: z.boolean().default(false),
  languages: z.array(z.enum(AD_LANGS)).default([]),
  // Solo nei duelli filtrati per queste specie (e in "Tutti")
  species: z.array(z.enum(SPECIES as [Species, ...Species[]])).default([]),
  audience: z.enum(['all', 'users', 'guests']).default('all'),
  // Giorni della settimana (1 = lunedì) e fascia oraria [from, to) nell'ora locale di chi vota
  days: z.array(z.number().int().min(1).max(7)).max(7).default([]),
  hours: z.object({ from: z.number().int().min(0).max(23), to: z.number().int().min(1).max(24) })
    .refine(h => h.from !== h.to, 'La fascia oraria è vuota').nullable().default(null),
})
export type AdTargeting = z.infer<typeof adTargetingSchema>
export const AD_TARGETING_DEFAULT: AdTargeting = adTargetingSchema.parse({})

// Accordo con l'inserzionista: referente, prezzo, tetti. Lo vede solo l'admin
export const AD_PRICE_TYPES = ['none', 'flat', 'cpm', 'cpc'] as const
const optionalCap = z.number().int().min(1).max(100_000_000).nullable().default(null)
export const adDealSchema = z.object({
  contactName: text(80).default(''),
  contactEmail: z.union([z.literal(''), z.string().trim().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email del referente non valida')]).default(''),
  contactPhone: text(40).default(''),
  notes: text(2000).default(''),
  // Prezzo in centesimi: totale (flat), ogni 1000 visualizzazioni (cpm) o a clic (cpc)
  priceType: z.enum(AD_PRICE_TYPES).default('none'),
  priceCents: z.number().int().min(0).max(100_000_000).default(0),
  // Arrivati a questi numeri la campagna smette di uscire
  maxViews: optionalCap,
  maxClicks: optionalCap,
  // Quante volte al giorno la stessa persona può vederla
  maxPerPersonDay: z.number().int().min(1).max(50).nullable().default(null),
})
export type AdDeal = z.infer<typeof adDealSchema>
export const AD_DEAL_DEFAULT: AdDeal = adDealSchema.parse({})

/** Quanto vale finora la campagna, in centesimi, secondo il prezzo concordato */
export function adValueCents(deal: Pick<AdDeal, 'priceType' | 'priceCents'>, views: number, clicks: number) {
  if (deal.priceType === 'flat') return deal.priceCents
  if (deal.priceType === 'cpm') return Math.round((views / 1000) * deal.priceCents)
  if (deal.priceType === 'cpc') return clicks * deal.priceCents
  return 0
}

// --- Testi dell'annuncio nelle lingue del sito ---
// Titolo, descrizione, pulsante e link (vuoto = quello della lingua predefinita)
export const adTextSchema = z.object({
  title: text(60).default(''),
  body: text(160).default(''),
  cta: text(24).default(''),
  url: z.union([z.literal(''), httpUrl]).default(''),
})
export type AdText = z.infer<typeof adTextSchema>
// Una lingua tradotta deve avere almeno titolo e pulsante; tutta vuota = si usa la predefinita
export const adTranslationsSchema = z.partialRecord(z.enum(AD_LANGS), adTextSchema).default({}).superRefine((all, ctx) => {
  for (const [lang, t] of Object.entries(all)) {
    if (!t) continue
    const started = t.title || t.body || t.cta || t.url
    if (started && (!t.title || !t.cta)) {
      ctx.addIssue({ code: 'custom', path: [lang], message: `${lang.toUpperCase()}: servono titolo e testo del pulsante, oppure lascia la lingua vuota` })
    }
  }
})
export type AdTranslations = z.infer<typeof adTranslationsSchema>
export const isTranslated = (t: AdText | undefined) => !!(t?.title && t.cta)

/** Testo da mostrare in una lingua: la traduzione se completa, altrimenti la lingua predefinita */
export function adTextFor(
  ad: { title: string, body: string, cta: string, url: string, defaultLang: AdLang, translations: AdTranslations },
  lang: AdLang | null,
): AdText & { lang: AdLang } {
  const t = lang && lang !== ad.defaultLang ? ad.translations[lang] : undefined
  if (lang && t && isTranslated(t)) return { title: t.title, body: t.body, cta: t.cta, url: t.url || ad.url, lang }
  return { title: ad.title, body: ad.body, cta: ad.cta, url: ad.url, lang: ad.defaultLang }
}

export const adFieldsSchema = z.object({
  name: text(60).min(1, 'Dai un nome alla campagna'),
  advertiser: text(60).default(''),
  title: text(60).min(1, 'Scrivi il titolo'),
  body: text(160).default(''),
  cta: text(24).min(1, 'Scrivi il testo del pulsante'),
  url: httpUrl,
  weight: z.coerce.number().int().min(1).max(10).default(1),
  active: z.coerce.boolean().default(true),
  startDate: optionalDate,
  endDate: optionalDate,
  targeting: adTargetingSchema.default(AD_TARGETING_DEFAULT),
  deal: adDealSchema.default(AD_DEAL_DEFAULT),
  // Lingua dei campi titolo/descrizione/pulsante/link qui sopra; le altre stanno in translations
  defaultLang: z.enum(AD_LANGS).default('it'),
  translations: adTranslationsSchema,
})
export type AdFields = z.infer<typeof adFieldsSchema>

// Immagine dell'annuncio: sempre 4:3. Il ritaglio è in frazioni dell'originale e può uscirne
// (immagine rimpicciolita): lo spazio vuoto si riempie col colore di sfondo
export const AD_IMAGE_RATIO = 4 / 3
const span = z.number().min(-10).max(10)
export const adCropSchema = z.object({
  x: span,
  y: span,
  w: z.number().gt(0).max(20),
  h: z.number().gt(0).max(20),
  bg: z.string().regex(/^#[0-9a-f]{6}$/i, 'Colore non valido'),
})
export type AdCrop = z.infer<typeof adCropSchema>

/** Annuncio come lo vede chi vota */
export interface PublicAd {
  id: number
  advertiser: string
  title: string
  body: string
  cta: string
  image: string | null
  // Passa dal server, che conta il clic e poi reindirizza
  href: string
}

/** Annuncio del circuito esterno: il contenuto lo sceglie Google dentro il riquadro */
export interface NetworkAd {
  network: 'adsense'
  client: string
  slot: string
}
export type ShownAd = PublicAd | NetworkAd
export const isNetworkAd = (ad: ShownAd): ad is NetworkAd => 'network' in ad

// Consenso ai cookie degli annunci Google: senza "ads" lo script di Google non si carica mai.
// I cookie tecnici del sito (accesso, lingua, tema) non chiedono consenso
export const CONSENT_COOKIE = 'consenso'
export type Consent = 'ads' | 'none'

export interface AdSlot {
  // Senza i dati del circuito: quelli arrivano solo nell'annuncio scelto
  settings: Omit<AdSettings, 'network'>
  ad: ShownAd | null
}

export interface AdminAd extends AdFields {
  id: number
  image: string | null
  // Originale da ritagliare di nuovo, con il ritaglio attuale
  imageSource: string | null
  imageCrop: AdCrop | null
  // "exhausted": raggiunto il tetto di visualizzazioni o clic
  status: 'live' | 'paused' | 'scheduled' | 'ended' | 'exhausted'
  views: number
  uniqueViews: number
  clicks: number
  uniqueClicks: number
  viewsToday: number
  // Valore maturato secondo il prezzo concordato, in centesimi
  valueCents: number
  // Ultimi 14 giorni
  days: { day: string, views: number, clicks: number }[]
  // Da dove e in che lingua l'hanno vista (le voci più frequenti)
  places: { country: string | null, city: string | null, views: number, clicks: number }[]
  languages: { lang: string | null, views: number, clicks: number }[]
  // Ore del giorno (0-23, ora italiana) in cui è stata vista
  hours: number[]
}

export interface AdminAds {
  settings: AdSettings
  ads: AdminAd[]
  // Riquadri del circuito mostrati: guadagni e clic si vedono solo nel pannello di Google
  network: { views: number, uniqueViews: number, days: { day: string, views: number }[] }
  // Posizione e lingua con cui il sito vede l'admin in questo momento
  you: { country: string | null, city: string | null, hasCoords: boolean, simulated: boolean, lang: string | null }
}

/** Risultato della ricerca di un indirizzo (OpenStreetMap) */
export interface GeocodeResult { label: string, lat: number, lng: number }
