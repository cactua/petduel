# PetDuel

Social dove si votano i pet più carini: in home due animali scelti "quasi a caso", si trascina il preferito sopra l'altro per farlo vincere.

Tutto in Nuxt 4, con un solo codice per più siti (animali, furry, moto…), ognuno sul suo dominio:

- `layers/core/` è il nucleo comune: pagine in `app/`, backend (Nitro, Node) in `server/`, tipi e regole condivise in `shared/`, testi in `i18n/`.
- `sites/<nome>/` è un sito: il suo `nuxt.config.ts` estende il nucleo e cambia solo ciò che serve. Ogni sito ha il suo `.env`, il suo database e le sue foto in `.data/`, quindi account e dati restano separati.
- Per ora c'è solo `sites/pets`.

## Avvio in locale

```bash
npm install
cp sites/pets/.env.example sites/pets/.env   # poi metti due stringhe casuali di almeno 32 caratteri
npm run dev
```

Apri http://localhost:3000. Al primo avvio il database viene creato e riempito con i pet di esempio.

Per ripartire da zero: ferma il server e cancella la cartella `sites/pets/.data/`.

### Diventare moderatore

1. Registrati dal sito.
2. Ferma il server e lancia `npm run make-admin -- <tuo-username>` (per un altro sito: `npm run make-admin -- <tuo-username> <sito>`).
3. Riavvia, esci e rientra: compare la voce **Moderazione** (su mobile si apre dal profilo, insieme a **Gestisci sfide**).

## Come funziona

- **Account**: email + password (hash scrypt). Votare non richiede l'account, caricare sì.
- **Pet e gallery**: ogni utente ha un profilo `/u/<username>` con un riquadro per pet e tutte le sue foto. Ogni pet ha anche la sua pagina `/pet/<id>`.
- **Coda di approvazione**: ogni foto nasce "in attesa" ed è visibile solo al proprietario e ai moderatori. Approvata diventa pubblica ed entra nei duelli; rifiutata viene cancellata e al proprietario resta il motivo. Massimo 10 foto in attesa per utente.
- **Duelli**: solo pet con almeno una foto approvata, mai i propri, sempre tra animali della stessa specie (cani, gatti, conigli, roditori, uccelli, rettili, altri). A ogni duello esce una foto a caso della gallery.
- **Classifiche**: `/classifica` e `/classifica/<specie>` (es. `/classifica/gatti`), con periodo `?periodo=settimana|mese|sempre`. Settimana e mese contano i punti Elo guadagnati nel periodo e si azzerano lunedì e il primo del mese (ora italiana); "sempre" usa l'Elo totale. Chi ha un account vede i propri pet evidenziati, anche fuori dalla top 50. La pagina del pet mostra la posizione tra quelli della sua specie.
- **Sfide settimanali**: `/sfide`. Ogni lunedì a mezzanotte (ora italiana) parte un tema nuovo dal calendario automatico (12 temi, alcuni solo per cani o solo per gatti) e dura 7 giorni. Si partecipa da `/sfide/<slug>?tab=partecipa` con una foto già approvata della gallery o con una foto nuova, che passa dalla coda di approvazione (il moderatore vede per quale sfida è e può rifiutarla come "Non in tema"). Un pet per sfida, solo della specie richiesta. I voti della sfida hanno un Elo separato da quello generale; a fine settimana il primo vince un trofeo che compare nella sua gallery e nell'albo d'oro. Gli admin possono programmare sfide proprie da `/admin/sfide`: sostituiscono quella automatica dello stesso periodo se non ha ancora partecipanti.
- **Card da condividere**: sulla pagina di ogni pet c'è **Condividi**, e chi è in gara in una sfida ha **Chiedi voti**. Si apre l'anteprima di una card verticale per le storie (1080×1920) con foto, nome, posizione e trofeo; si può condividere direttamente (su telefono, con il menu di condivisione del sistema), scaricare o copiare il link. Il link `/pet/<id>` (con `?sfida=<slug>` se viene da una sfida) mostra in chat e sui social un'anteprima orizzontale (1200×630). Le immagini sono disegnate dal server in `/card/<id>.png?formato=story|og` (satori + resvg, font in `server/assets/fonts`) e solo per pet con foto approvate.
- **Pet di esempio**: circa 66 pet con foto vere a licenza libera da Wikimedia Commons, divisi per specie. Sono in `server/assets/seed` e finiscono nel database al primo avvio. Autore e licenza di ogni foto compaiono sulla foto stessa e nella pagina `/crediti`. Per rifare la selezione: `node scripts/commons/discover.mjs <cartella>` crea dei provini numerati per specie; le foto scelte vanno in `scripts/commons/pets.json`; `node scripts/commons/import.mjs` le scarica e le ritaglia. Poi si cancella `sites/pets/.data` per ricreare il database.

## Sicurezza

| Rischio | Difesa |
| --- | --- |
| Password rubate dal DB | Hash scrypt (`nuxt-auth-utils`), mai salvate in chiaro |
| Brute force sul login | 10 tentativi ogni 15 minuti per IP su `/api/auth/*`; stesso messaggio e stesso tempo di risposta che l'email esista o no |
| Furto di sessione | Cookie cifrato, `HttpOnly`, `SameSite=Lax`, `Secure` in produzione |
| CSRF | Ogni POST/DELETE su `/api` deve avere `Origin` uguale al sito ([server/middleware/origin.ts](layers/core/server/middleware/origin.ts)) |
| XSS | Vue fa l'escape di tutto, niente `v-html`; CSP con nonce, `X-Frame-Options: DENY`, `nosniff` (`nuxt-security`) |
| SQL injection | Solo query parametrizzate (Drizzle) |
| File malevoli | Ogni upload è decodificato e ricodificato in WebP da `sharp`: tutto ciò che non è un'immagine viene rifiutato, metadati e payload nascosti spariscono. Limite 10 MB e 50 megapixel |
| Foto non approvate | Servite solo a proprietario e moderatori, mai in cache pubblica |
| Accessi non autorizzati | Ogni API controlla lato server proprietario e ruolo; utente e ruolo si rileggono dal DB a ogni richiesta, quindi un account eliminato o declassato perde subito l'accesso |
| Voti truccati | Token firmato per coppia (legato a duelli o alla singola sfida), un voto per coppia per votante, minimo 300 ms tra coppia e voto; i propri pet non compaiono mai |
| Abusi in generale | Rate limit globale per IP, limite dimensione richieste |

Da fare prima di andare online: HTTPS, Postgres gestito con backup, rate limit condiviso (Redis) se ci sono più istanze, verifica email e recupero password (serve un servizio email), Cloudflare davanti al sito, `npm audit` periodico.

## Struttura

I percorsi qui sotto sono dentro `layers/core/`.

| Percorso | Cosa fa |
| --- | --- |
| `app/pages/index.vue` | Duelli: carica la coppia successiva in anticipo |
| `app/components/DuelArena.vue` | Gesto "trascina sopra l'altro", frecce animate, demo iniziale, tastiera |
| `app/pages/u/[username].vue`, `app/components/PetGallery.vue` | Profilo con gallery per pet |
| `app/pages/carica.vue` | Nuovo pet o nuova foto per un pet esistente |
| `app/pages/admin.vue`, `app/pages/admin/*` | Pannello admin: panoramica, foto, utenti, rifugi, sfide, pubblicità |
| `server/utils/ads.ts`, `app/components/AdCard.vue` | Pubblicità custom tra un duello e l'altro, con visualizzazioni e clic |
| `app/pages/sfide/*`, `app/pages/admin/sfide.vue` | Sfide settimanali e gestione admin |
| `server/utils/cards.ts`, `app/components/ShareCard.vue` | Card da condividere e anteprime dei link |
| `server/utils/challenges.ts` | Calendario dei temi, creazione automatica, classifica e trofei delle sfide |
| `server/api/auth/*` | Registrazione, login, logout |
| `server/api/admin/*` | API dell'admin (solo ruolo admin) |
| `server/utils/photos.ts` | Upload sicuro e limite di foto in attesa |
| `server/utils/ranking.ts` | Elo e criteri di scelta della coppia |
| `server/db/schema.ts` | Tabelle `users`, `pets`, `photos`, `votes` (Drizzle) |
