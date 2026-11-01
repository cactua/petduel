// https://nuxt.com/docs/api/configuration/nuxt-config
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
  modules: ["nuxt-auth-utils", "nuxt-security", "@nuxtjs/i18n", "@nuxt/eslint"],

  // Lingue: stessi indirizzi per tutte, la scelta resta in un cookie. Alla prima visita si usa
  // la lingua del browser (se non è tra queste, inglese). Testi in i18n/locales/<lingua>.json
  i18n: {
    strategy: "no_prefix",
    defaultLocale: "it",
    locales: [
      { code: "it", language: "it-IT", name: "Italiano", file: "it.json" },
      { code: "en", language: "en-US", name: "English", file: "en.json" },
      { code: "es", language: "es-ES", name: "Español", file: "es.json" },
      { code: "fr", language: "fr-FR", name: "Français", file: "fr.json" },
      { code: "de", language: "de-DE", name: "Deutsch", file: "de.json" },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "lingua",
      fallbackLocale: "en",
      redirectOn: "root",
    },
  },
  // Stili in SCSS (Atomic Design + BEM): globali in assets/scss, il resto nei componenti
  css: ["~/assets/scss/main.scss"],
  // Componenti divisi in atoms/molecules/organisms senza cambiare i nomi usati nei template
  components: [{ path: "~/components", pathPrefix: false }],
  vite: {
    css: {
      preprocessorOptions: {
        // Token, breakpoint e mixin disponibili in ogni <style lang="scss">
        scss: { additionalData: '@use "~/assets/scss/abstracts" as *;\n' },
      },
    },
  },

  app: {
    head: {
      title: "PetDuel",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#fff6ef" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap",
        },
      ],
    },
  },

  runtimeConfig: {
    // Da .env: NUXT_VOTE_SECRET
    voteSecret: "",
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
    },
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
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "style-src": [
          "'self'",
          "https://fonts.googleapis.com",
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
    "/admin/moderazione": { redirect: "/admin/foto" },
    // Login e registrazione: pochi tentativi per IP contro brute force e spam di account
    "/api/auth/**": {
      security: {
        rateLimiter: { tokensPerInterval: 10, interval: 15 * 60 * 1000 },
      },
    },
  },

  nitro: {
    storage: {
      uploads: { driver: "fs", base: "./.data/uploads" },
    },
  },
});
