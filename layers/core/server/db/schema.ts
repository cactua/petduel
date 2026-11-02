import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'
import type { AdoptionStatus, PetSize, PhotoStatus, ReportReason, ReportStatus, RequestStatus, ShelterAccent, ShelterSocials, ShelterStatus, Species } from '#shared/models'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'user' | 'admin'>().notNull().default('user'),
  // Account sospeso da un admin: non può accedere né usare la sessione
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  // Siti con askCredit: chi si segna come artista si può indicare come autore dei disegni caricati da altri
  isArtist: boolean('is_artist').notNull().default(false),
  // Pagine social dell'artista (http/https), mostrate sul profilo
  artistLinks: jsonb('artist_links').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  species: text('species').$type<Species>().notNull(),
  breed: text('breed').notNull().default(''),
  city: text('city').notNull().default(''),
  elo: real('elo').notNull().default(1500),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  // Scheda di adozione: solo per i pet di un rifugio verificato
  adoption: text('adoption').$type<AdoptionStatus>(),
  sex: text('sex').$type<'m' | 'f'>(),
  age: text('age').notNull().default(''),
  size: text('size').$type<PetSize>(),
  neutered: boolean('neutered'),
  about: text('about').notNull().default(''),
  // Il rifugio può tenerlo fuori da classifiche e sfide (resta nei duelli e in "Cerca casa")
  hideFromRankings: boolean('hide_from_rankings').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Rifugio, canile o associazione: un account ne gestisce uno, visibile solo dopo la verifica di un moderatore
export const shelters = pgTable('shelters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  description: text('description').notNull(),
  website: text('website').notNull().default(''),
  // Privati: servono solo ai moderatori e al rifugio stesso
  taxCode: text('tax_code').notNull(),
  contactEmail: text('contact_email').notNull(),
  phone: text('phone').notNull().default(''),
  status: text('status').$type<ShelterStatus>().notNull().default('pending'),
  // Pagina pubblica personalizzata dal rifugio
  tagline: text('tagline').notNull().default(''),
  help: text('help').notNull().default(''),
  needs: jsonb('needs').$type<string[]>().notNull().default([]),
  accent: text('accent').$type<ShelterAccent>().notNull().default('coral'),
  logo: text('logo'),
  banner: text('banner'),
  address: text('address').notNull().default(''),
  lat: real('lat'),
  lng: real('lng'),
  hours: text('hours').notNull().default(''),
  publicEmail: text('public_email').notNull().default(''),
  publicPhone: text('public_phone').notNull().default(''),
  socials: jsonb('socials').$type<ShelterSocials>().notNull().default({}),
  donateUrl: text('donate_url').notNull().default(''),
  iban: text('iban').notNull().default(''),
  rejectReason: text('reject_reason'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Richiesta di adozione: arriva solo al rifugio, una per persona e per pet
export const adoptionRequests = pgTable('adoption_requests', {
  id: serial('id').primaryKey(),
  petId: integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  shelterId: integer('shelter_id').notNull().references(() => shelters.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  phone: text('phone').notNull().default(''),
  status: text('status').$type<RequestStatus>().notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.petId, t.userId)])

// Ogni foto passa dalla coda di approvazione prima di diventare pubblica
export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  petId: integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  image: text('image').notNull().unique(),
  status: text('status').$type<PhotoStatus>().notNull().default('pending'),
  rejectReason: text('reject_reason'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  // Autore e licenza da citare: foto di esempio (Wikimedia Commons) o artista indicato da chi carica (askCredit)
  credit: text('credit'),
  creditUrl: text('credit_url'),
  // Artista registrato scelto da chi carica: credit è il suo username e credit_url il suo profilo ("/u/…")
  artistId: integer('artist_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  voterId: text('voter_id').notNull(),
  pairKey: text('pair_key').notNull(),
  winnerId: integer('winner_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  loserId: integer('loser_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  // Punti Elo passati dal perdente al vincitore con questo voto
  delta: real('delta').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.voterId, t.pairKey)])

// Sfida settimanale a tema: ha partecipanti, duelli e classifica propri
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  emoji: text('emoji').notNull(),
  species: text('species').$type<Species>(),
  adoptionOnly: boolean('adoption_only').notNull().default(false),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Un pet partecipa una volta per sfida, con una foto; l'Elo della sfida parte da zero
export const challengeEntries = pgTable('challenge_entries', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  petId: integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  photoId: integer('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  elo: real('elo').notNull().default(1500),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.challengeId, t.petId)])

export const challengeVotes = pgTable('challenge_votes', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  voterId: text('voter_id').notNull(),
  pairKey: text('pair_key').notNull(),
  winnerId: integer('winner_id').notNull().references(() => challengeEntries.id, { onDelete: 'cascade' }),
  loserId: integer('loser_id').notNull().references(() => challengeEntries.id, { onDelete: 'cascade' }),
  delta: real('delta').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.challengeId, t.voterId, t.pairKey)])

// Avvisi per il proprietario (foto moderate, risultati delle sfide, posizioni in classifica).
// "key" identifica l'evento: lo stesso avviso non si crea due volte
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  emoji: text('emoji').notNull(),
  // Con params, text è una chiave di traduzione (notif.*): il sito la traduce nella lingua di chi legge
  text: text('text').notNull(),
  params: text('params'),
  link: text('link'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.userId, t.key)])

// Segnalazioni degli utenti su un'immagine pubblicata o su un profilo, per i moderatori.
// Una persona segnala la stessa cosa una volta sola; chiusa da un admin (resolved: si è intervenuti, dismissed: niente da fare)
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  photoId: integer('photo_id').references(() => photos.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').$type<ReportReason>().notNull(),
  note: text('note').notNull().default(''),
  status: text('status').$type<ReportStatus>().notNull().default('open'),
  resolvedBy: integer('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [unique().on(t.reporterId, t.photoId), unique().on(t.reporterId, t.userId)])

// Pubblicità custom: card mostrata tra un duello e l'altro, ogni N voti
export const ads = pgTable('ads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  advertiser: text('advertiser').notNull().default(''),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  cta: text('cta').notNull(),
  url: text('url').notNull(),
  // Immagine mostrata (già ritagliata) e originale caricato, per poterla ritagliare di nuovo
  image: text('image'),
  imageSource: text('image_source'),
  imageCrop: text('image_crop'),
  // Più alto = esce più spesso rispetto agli altri annunci attivi
  weight: integer('weight').notNull().default(1),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  // Lingua di titolo, descrizione, pulsante e link; le altre lingue in translations (JSON, AdTranslations)
  defaultLang: text('default_lang').notNull().default('it'),
  translations: text('translations'),
  // JSON: pubblico (AdTargeting) e accordo con l'inserzionista (AdDeal)
  targeting: text('targeting'),
  deal: text('deal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Visualizzazioni e clic, per CTR e utenti unici, con paese, città e lingua di chi li fa
export const adEvents = pgTable('ad_events', {
  id: serial('id').primaryKey(),
  adId: integer('ad_id').notNull().references(() => ads.id, { onDelete: 'cascade' }),
  type: text('type').$type<'view' | 'click'>().notNull(),
  voterId: text('voter_id').notNull(),
  country: text('country'),
  city: text('city'),
  lang: text('lang'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Riquadri del circuito esterno (Google) davvero mostrati: i clic restano dentro il riquadro di Google
export const adNetworkViews = pgTable('ad_network_views', {
  id: serial('id').primaryKey(),
  voterId: text('voter_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Impostazioni modificabili dall'admin (valore JSON)
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export type Pet = typeof pets.$inferSelect
export type Challenge = typeof challenges.$inferSelect
export type User = typeof users.$inferSelect
export type Shelter = typeof shelters.$inferSelect
export type Ad = typeof ads.$inferSelect
export type Report = typeof reports.$inferSelect

// Tenuto allineato a mano con le tabelle sopra finché non introduciamo drizzle-kit
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pets (
  id serial PRIMARY KEY,
  owner_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  breed text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  elo real NOT NULL DEFAULT 1500,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pets_species_elo ON pets (species, elo);
CREATE INDEX IF NOT EXISTS pets_owner ON pets (owner_id);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS adoption text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS sex text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age text NOT NULL DEFAULT '';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS neutered boolean;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS about text NOT NULL DEFAULT '';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS hide_from_rankings boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS pets_adoption ON pets (adoption) WHERE adoption IS NOT NULL;
CREATE TABLE IF NOT EXISTS shelters (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  description text NOT NULL,
  website text NOT NULL DEFAULT '',
  tax_code text NOT NULL,
  contact_email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reject_reason text,
  reviewed_by integer REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shelters_status ON shelters (status, created_at);
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS help text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS needs jsonb NOT NULL DEFAULT '[]';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT 'coral';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS logo text;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS banner text;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS lat real;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS lng real;
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS hours text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS public_email text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS public_phone text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS donate_url text NOT NULL DEFAULT '';
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS iban text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS adoption_requests (
  id serial PRIMARY KEY,
  pet_id integer NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  shelter_id integer NOT NULL REFERENCES shelters (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message text NOT NULL,
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pet_id, user_id)
);
CREATE INDEX IF NOT EXISTS adoption_requests_shelter ON adoption_requests (shelter_id, created_at);
CREATE INDEX IF NOT EXISTS adoption_requests_user ON adoption_requests (user_id, created_at);
CREATE TABLE IF NOT EXISTS photos (
  id serial PRIMARY KEY,
  pet_id integer NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  image text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  reject_reason text,
  reviewed_by integer REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS credit text;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS credit_url text;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS artist_id integer REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS photos_artist ON photos (artist_id) WHERE artist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS photos_pet_status ON photos (pet_id, status);
CREATE INDEX IF NOT EXISTS photos_status_created ON photos (status, created_at);
CREATE TABLE IF NOT EXISTS votes (
  id serial PRIMARY KEY,
  voter_id text NOT NULL,
  pair_key text NOT NULL,
  winner_id integer NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  loser_id integer NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  delta real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voter_id, pair_key)
);
ALTER TABLE votes ADD COLUMN IF NOT EXISTS delta real NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS votes_created ON votes (created_at);
-- Cuori di un pet nel periodo (classifiche di settimana e mese)
CREATE INDEX IF NOT EXISTS votes_winner_created ON votes (winner_id, created_at);
CREATE TABLE IF NOT EXISTS challenges (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL,
  species text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_by integer REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS adoption_only boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS challenges_dates ON challenges (starts_at, ends_at);
CREATE TABLE IF NOT EXISTS challenge_entries (
  id serial PRIMARY KEY,
  challenge_id integer NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
  pet_id integer NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  photo_id integer NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  elo real NOT NULL DEFAULT 1500,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, pet_id)
);
CREATE INDEX IF NOT EXISTS challenge_entries_photo ON challenge_entries (photo_id);
CREATE TABLE IF NOT EXISTS challenge_votes (
  id serial PRIMARY KEY,
  challenge_id integer NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  pair_key text NOT NULL,
  winner_id integer NOT NULL REFERENCES challenge_entries (id) ON DELETE CASCADE,
  loser_id integer NOT NULL REFERENCES challenge_entries (id) ON DELETE CASCADE,
  delta real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, voter_id, pair_key)
);
CREATE TABLE IF NOT EXISTS reports (
  id serial PRIMARY KEY,
  reporter_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  photo_id integer REFERENCES photos (id) ON DELETE CASCADE,
  user_id integer REFERENCES users (id) ON DELETE CASCADE,
  reason text NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  resolved_by integer REFERENCES users (id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, photo_id),
  UNIQUE (reporter_id, user_id),
  CHECK ((photo_id IS NULL) <> (user_id IS NULL))
);
CREATE INDEX IF NOT EXISTS reports_open ON reports (created_at) WHERE status = 'open';
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key text NOT NULL,
  emoji text NOT NULL,
  text text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS params TEXT;
CREATE INDEX IF NOT EXISTS notifications_user_created ON notifications (user_id, created_at);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_artist boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_links jsonb NOT NULL DEFAULT '[]';
CREATE INDEX IF NOT EXISTS users_artists ON users (username) WHERE is_artist;
CREATE INDEX IF NOT EXISTS users_created ON users (created_at);
CREATE INDEX IF NOT EXISTS challenge_votes_created ON challenge_votes (created_at);
CREATE TABLE IF NOT EXISTS ads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  advertiser text NOT NULL DEFAULT '',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  cta text NOT NULL,
  url text NOT NULL,
  image text,
  weight integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ad_events (
  id serial PRIMARY KEY,
  ad_id integer NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  type text NOT NULL,
  voter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_source text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_crop text;
CREATE INDEX IF NOT EXISTS ad_events_ad_created ON ad_events (ad_id, created_at);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS targeting text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS deal text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS default_lang text NOT NULL DEFAULT 'it';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS translations text;
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS lang text;
CREATE TABLE IF NOT EXISTS ad_network_views (
  id serial PRIMARY KEY,
  voter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_network_views_created ON ad_network_views (created_at);
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
`
