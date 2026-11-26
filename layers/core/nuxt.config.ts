// https://nuxt.com/docs/api/configuration/nuxt-config
// Nucleo condiviso da tutti i siti: ogni sito in sites/<nome> lo estende e cambia solo ciò che serve.
// I percorsi qui partono da questa cartella: "~" e "~~" indicano invece la cartella del sito
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { addTemplate, updateTemplates } from "@nuxt/kit";
// jiti arriva con Nuxt: serve a leggere site.config.ts (TypeScript) mentre si costruiscono le rotte
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "./i18n/languages";

const coreDir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Testi del sito sopra quelli del nucleo: gli oggetti si uniscono, liste e testi si sostituiscono
type Messages = Record<string, unknown>;
const isObject = (v: unknown): v is Messages => typeof v === "object" && v !== null && !Array.isArray(v);
function mergeMessages(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObject(v) && isObject(out[k]) ? mergeMessages(out[k] as Messages, v) : v;
  return out;
}
const isDev = process.env.NODE_ENV === "development";

// Domini da cui Google AdSense carica immagini e pixel di misurazione
const MAP_TILES = process.env.NUXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
// Origine dei tile per la CSP ("{s}" nei sottodomini diventa "*")
const MAP_TILES_ORIGIN = MAP_TILES.replace(/^(https:\/\/[^/]+).*$/, "$1").replace("{s}", "*");

const GOOGLE_ADS = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleusercontent.com",
  "https://*.googleadservices.com",
  "https://*.adtrafficquality.google", // controllo antifrode dei clic
];

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  alias: {
    // "#shared" punterebbe alla cartella shared del sito: qui serve quella del nucleo
    "#shared": coreDir("./shared"),
    "@core": coreDir("./"),
  },
  modules: [
    // "#site" è il site.config.ts del sito che si sta avviando (categorie, temi delle sfide…),
    // "#site-it" i testi in italiano del nucleo con sopra quelli del sito (motivi di rifiuto e categorie
    // per l'admin, domanda e categorie per le card). È un modulo generato e non il file JSON: i file in
    // i18n/locales importati nel browser vengono compilati dal modulo i18n e non sono più testo semplice
    async (_options, nuxt) => {
      nuxt.options.alias["#site"] = join(nuxt.options.rootDir, "site.config.ts");
      const files = [coreDir("./i18n/locales/it.json"), join(nuxt.options.rootDir, "i18n/locales/it.json")];
      const template = addTemplate({
        filename: "site-it.ts",
        write: true,
        getContents: () => {
          const messages = files.map(f => JSON.parse(readFileSync(f, "utf8"))).reduce(mergeMessages, {});
          return `const messages: Record<string, any> = ${JSON.stringify(messages, null, 2)}
export default messages
`;
        },
      });
      nuxt.options.alias["#site-it"] = template.dst;

      // "#site-messages": i testi di tutte le lingue (nucleo + sito), per quello che il server scrive da solo
      // nella lingua di chi legge, come le notifiche push
      const allFiles = LANGUAGES.flatMap(l => [coreDir(`./i18n/locales/${l.code}.json`), join(nuxt.options.rootDir, `i18n/locales/${l.code}.json`)]);
      const messagesTemplate = addTemplate({
        filename: "site-messages.ts",
        write: true,
        getContents: () => {
          const read = (f: string) => { try { return JSON.parse(readFileSync(f, "utf8")) as Messages; } catch { return {}; } };
          const all = Object.fromEntries(LANGUAGES.map(l => [l.code, mergeMessages(read(coreDir(`./i18n/locales/${l.code}.json`)), read(join(nuxt.options.rootDir, `i18n/locales/${l.code}.json`)))]));
          return `const messages: Record<string, Record<string, any>> = ${JSON.stringify(all)}
export default messages
`;
        },
      });
      nuxt.options.alias["#site-messages"] = messagesTemplate.dst;

      // La pagina di un partecipante si chiama come vuole il sito (site.entryPath): /pet/<id> diventa per esempio
      // /character/<id>, e i vecchi /pet/<id> ci portano con un redirect
      const { entryPath: entry } = (await createJiti(import.meta.url).import<{ default: { entryPath?: string } }>(nuxt.options.alias["#site"])).default;
      if (entry && entry !== "pet") {
        nuxt.options.routeRules ||= {};
        nuxt.options.routeRules["/pet/**"] = { redirect: { to: `/${entry}/**`, statusCode: 301 } };
        nuxt.hook("pages:extend", (pages) => {
          for (const page of pages) {
            if (page.path === "/pet/:id()") page.path = `/${entry}/:id()`;
          }
        });
      }
      nuxt.hook("builder:watch", (_event, path) => {
        const same = (f: string) => f.replaceAll("\\", "/").endsWith(path.replaceAll("\\", "/"));
        if (allFiles.some(same)) {
          return updateTemplates({ filter: t => t.filename === "site-it.ts" || t.filename === "site-messages.ts" });
        }
      });
    },
    "nuxt-auth-utils",
    "nuxt-security",
    "@nuxtjs/i18n",
    "@nuxt/eslint",
  ],

  // Lingue: stessi indirizzi per tutte, la scelta resta in un cookie. Alla prima visita si usa
  // la lingua del browser (se non è tra queste, inglese). Testi in i18n/locales/<lingua>.json
  i18n: {
    strategy: "no_prefix",
    defaultLocale: "it",
    locales: LANGUAGES,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "lang", // LANG_COOKIE in shared/models.ts
      fallbackLocale: "en",
      redirectOn: "root",
    },
  },
  // Stili in SCSS (Atomic Design + BEM): globali in assets/scss, il resto nei componenti
  // Font serviti dal sito stesso (@fontsource), non da Google: nessun IP di chi visita passa a Google per i font
  css: [
    ...["fredoka/500", "fredoka/600", "fredoka/700", "nunito/400", "nunito/600", "nunito/700", "nunito/800"]
      .map(f => `@fontsource/${f}.css`),
    coreDir("./app/assets/scss/main.scss"),
  ],
  // Componenti divisi in atoms/molecules/organisms senza cambiare i nomi usati nei template
  components: [{ path: coreDir("./app/components"), pathPrefix: false }],
  vite: {
    css: {
      preprocessorOptions: {
        // Token, breakpoint e mixin disponibili in ogni <style lang="scss">
        scss: { additionalData: '@use "@core/app/assets/scss/abstracts" as *;\n' },
      },
    },
  },

  app: {
    head: {
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
      ],
    },
  },

  runtimeConfig: {
    // Da .env: NUXT_VOTE_SECRET
    voteSecret: "",
    // IP di chi visita dietro un proxy (vedi server/utils/clientIp.ts). Da .env: NUXT_CLIENT_IP_HEADER
    // (es. cf-connecting-ip) oppure NUXT_TRUSTED_PROXY_HOPS (es. 1). Vuoti = indirizzo della connessione
    clientIpHeader: "",
    trustedProxyHops: 0,
    // Da quale rete arrivano paese e città di chi visita (pubblicità mirate, classifica per città).
    // Da .env: NUXT_GEO_HEADERS=cloudflare oppure vercel. Vuoto = posizione sconosciuta (in sviluppo: NUXT_DEV_GEO)
    geoHeaders: "",
    // Invio delle email (verifica dell'indirizzo, recupero password) con un server SMTP qualsiasi.
    // Da .env: NUXT_SMTP_URL (smtps://utente:password@host:465) e NUXT_SMTP_FROM ("PetDuel <noreply@dominio>").
    // Senza, in sviluppo il link si scrive nel log del server; in produzione le email non partono
    smtpUrl: "",
    smtpFrom: "",
    // Indirizzo pubblico del sito per i link nelle email (https://furduel.it). Da .env: NUXT_SITE_URL.
    // Non si prende dalla richiesta: un Host falso manderebbe il link per la nuova password a un altro sito
    siteUrl: "",
    // Verifica in due passaggi: obbligatoria per gli admin (le API admin rispondono 403 finché non la
    // attivano da /account). Da .env: NUXT_REQUIRE_ADMIN_TOTP=false per spegnere l'obbligo (sconsigliato).
    // NUXT_TOTP_KEY cifra i segreti nel database; vuota = si usa NUXT_SESSION_PASSWORD (cambiandola,
    // chi ha la verifica attiva deve entrare con un codice di emergenza e riattivarla)
    requireAdminTotp: true,
    totpKey: "",
    public: {
      // Chi gestisce il sito e l'email per la privacy, mostrati nelle pagine legali.
      // Da .env: NUXT_PUBLIC_LEGAL_OWNER, NUXT_PUBLIC_LEGAL_EMAIL
      // Tile della mappa dei rifugi (OpenStreetMap). Con molto traffico conviene un fornitore di tile
      // apposito: da .env NUXT_PUBLIC_MAP_TILES e NUXT_PUBLIC_MAP_ATTRIBUTION
      map: {
        tiles: MAP_TILES,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
      // Da .env: NUXT_PUBLIC_LEGAL_OWNER e NUXT_PUBLIC_LEGAL_EMAIL (dati personali, fuori dal repository)
      legal: {
        owner: "",
        email: "",
      },
      // Email per chi vuole fare pubblicità (pagina /advertise); vuota = quella delle pagine legali.
      // Da .env: NUXT_PUBLIC_ADS_EMAIL
      adsEmail: "",
      // Notifiche push: chiave pubblica VAPID (da .env: NUXT_PUBLIC_VAPID_PUBLIC_KEY). Vuota = push spente
      vapidPublicKey: "",
    },
    // Chiave privata VAPID e contatto per i servizi push (da .env: NUXT_VAPID_PRIVATE_KEY, NUXT_VAPID_SUBJECT
    // come "mailto:indirizzo"). Le chiavi si creano con: npx web-push generate-vapid-keys
    vapidPrivateKey: "",
    vapidSubject: "",
    session: {
      // Sessione di 30 giorni; cookie httpOnly, SameSite=Lax, Secure in produzione
      password: "", // da .env: NUXT_SESSION_PASSWORD
      maxAge: 60 * 60 * 24 * 30,
      cookie: { sameSite: "lax", secure: !isDev },
    },
  },

  // Header di sicurezza, rate limit e limiti di dimensione (nuxt-security)
  security: {
    headers: {
      contentSecurityPolicy: {
        // Le immagini degli annunci Google arrivano dai loro domini (i riquadri sono iframe, non limitati)
        "img-src": ["'self'", "data:", "blob:", MAP_TILES_ORIGIN, ...GOOGLE_ADS],
        "font-src": ["'self'"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
        ],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": !isDev,
      },
      xFrameOptions: "DENY",
      // Gli iframe degli annunci Google non mandano gli header CORP/COEP: con "credentialless" non
      // si caricherebbero, e il clic su un annuncio apre una finestra che deve restare collegata
      crossOriginEmbedderPolicy: "unsafe-none",
      crossOriginOpenerPolicy: "same-origin-allow-popups",
      referrerPolicy: "strict-origin-when-cross-origin",
      // Disattivati solo in sviluppo: in locale non c'è HTTPS
      strictTransportSecurity: isDev
        ? false
        : { maxAge: 31536000, includeSubdomains: true },
    },
    rateLimiter: {
      // Generale per IP: largo abbastanza per chi vota a raffica
      tokensPerInterval: 600,
      interval: 5 * 60 * 1000,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 100_000,
      maxUploadFileRequestInBytes: 11 * 1024 * 1024,
    },
  },

  routeRules: {
    // Vecchio indirizzo della coda di approvazione
    "/admin/moderation": { redirect: "/admin/photos" },
    // Vecchi indirizzi in italiano: chi ha un link salvato arriva alla pagina nuova
    ...Object.fromEntries(
      Object.entries({
        "/accedi": "/login", "/registrati": "/signup", "/carica": "/upload", "/crediti": "/credits",
        "/preferiti": "/favorites", "/regole": "/rules", "/seguiti": "/following", "/termini": "/terms",
        "/votati": "/voted", "/classifica": "/leaderboard", "/classifica/**": "/leaderboard", "/sfide": "/challenges",
        "/sfide/**": "/challenges/**", "/admin/foto": "/admin/photos", "/admin/pubblicita": "/admin/ads",
        "/admin/segnalazioni": "/admin/reports", "/admin/sfide": "/admin/challenges", "/admin/utenti": "/admin/users",
        "/rifugi": "/shelters", "/rifugi/**": "/shelters/**", "/rifugio": "/my-shelter", "/admin/rifugi": "/admin/shelters",
      }).map(([from, to]) => [from, { redirect: { to, statusCode: 301 } }]),
    ),
    // Login e registrazione: pochi tentativi per IP contro brute force e spam di account
    "/api/auth/**": {
      security: {
        rateLimiter: { tokensPerInterval: 10, interval: 15 * 60 * 1000 },
      },
    },
  },

  nitro: {
    // Foto dei pet di esempio e font delle card. Non "server": Nitro aggiunge da sé quel nome per la cartella del sito
    serverAssets: [{ baseName: "core", dir: coreDir("./server/assets") }],
    storage: {
      uploads: { driver: "fs", base: "./.data/uploads" },
    },
  },
});
