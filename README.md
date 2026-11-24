# PetDuel

Social dove si votano i pet più carini: in home due animali scelti "quasi a caso", si trascina il preferito sopra l'altro per farlo vincere.

Tutto in Nuxt 4, con un solo codice per più siti (animali, furry, moto…), ognuno sul suo dominio:

- `layers/core/` è il nucleo comune: pagine in `app/`, backend (Nitro, Node) in `server/`, tipi e regole condivise in `shared/`, testi in `i18n/`.
- `layers/shelters/` sono rifugi e adozioni (pagine, API, testi): li ha solo chi lo mette in `extends`, come `sites/pets`. Tabelle e letture dei dati restano nel nucleo; il nucleo mostra i link ai rifugi solo se `useAppConfig().features.shelters` è acceso, e il layer sostituisce il segnaposto vuoto `AdoptionCard` con la scheda vera.
- `sites/<nome>/` è un sito: il suo `nuxt.config.ts` estende il nucleo e cambia solo ciò che serve. Ogni sito ha il suo `.env`, il suo database e le sue foto in `.data/`, quindi account e dati restano separati.
- Ogni sito descrive ciò che lo distingue in `site.config.ts` (categorie, temi delle sfide automatiche; il formato è in `layers/core/shared/site.ts`) e mette i suoi contenuti di esempio in `server/assets/seed`.
- Testi: il nucleo ha testi neutri in `layers/core/i18n/locales`; ogni sito mette in `sites/<nome>/i18n/locales` solo le voci che cambiano (nomi delle categorie, temi, "Chi è più carino?"…). Il nome del sito si scrive `@:{'site.name'}` e viene da `site.config.ts`. I motivi di rifiuto (`reasons`) sono una lista: chi la cambia la riscrive tutta, e l'ultima voce resta quella delle sfide.
- Aspetto: un sito può ridefinire i colori del nucleo in un suo foglio (`sites/furry/app/assets/theme.scss`, caricato con `css` nel suo `nuxt.config.ts`) e cambiare mascotte mettendo un `SiteMascot.vue` in `app/components` (quello di furry non mostra nulla). Gli stessi colori e la stessa mascotte vanno anche in `brand` del `site.config.ts`: li usano le card da condividere (create sul server) e la barra del browser su mobile; senza `mascotSvg` le card non hanno mascotte.
- Con `breedAndCity: false` nel `site.config.ts` razza e città spariscono da caricamento, modifica e classifica (furry).
- I testi in italiano che servono fuori dalle traduzioni (motivi di rifiuto, nomi delle categorie, domanda delle card) si leggono da `#site-it`: un modulo generato all'avvio che unisce `it.json` del nucleo e del sito. Dopo aver cambiato quei file, riavvia il server se non li vedi aggiornati.
- Con `askCredit: true` nel `site.config.ts` chi carica può indicare l'artista (nome e link, facoltativi): compare sotto l'immagine, nella pagina dei crediti e nella coda di moderazione. Lo usa il sito furry, dove chi carica un disegno può non esserne l'autore. Sugli stessi siti ci si può segnare come artista dalla pagina account, con le proprie pagine social: chi carica trova gli artisti registrati mentre scrive il nome, e sceglierne uno collega il disegno al suo profilo (`/u/…`). Se l'artista elimina l'account, il suo nome sparisce dai disegni degli altri. Sul suo profilo l'artista vede i disegni che gli attribuiscono (riceve un avviso quando uno viene approvato) e per ognuno può togliere il suo nome o segnalarlo come pubblicato senza permesso.
- Il simbolo accanto al nome del sito (logo e medaglietta dei duelli) è `SiteIcon.vue`: nel nucleo la zampa, un sito lo cambia mettendo il suo in `app/components` (il sito moto ha una moto). Le orecchie sopra le foto compaiono solo per le specie del sito degli animali. Con `wideMedia: true` in `site.config.ts` (sito moto) su computer le card dei duelli sono orizzontali 3:2 invece che verticali, per i soggetti larghi.
- Siti: `sites/pets` (`npm run dev`, porta 3000), `sites/furry` (`npm run dev:furry`, porta 3001, ancora in preparazione: per ora senza categorie, quindi tutti i disegni competono insieme) e `sites/moto` (BikeDuel, `npm run dev:moto`, porta 3002: foto di moto divise per tipo, con marca e modello al posto della razza, pagina `/bike/<id>`, palette arancio e antracite, niente mascotte, moto di esempio da Wikimedia Commons).

## Avvio in locale

```bash
npm install
cp sites/pets/.env.example sites/pets/.env   # poi metti due stringhe casuali di almeno 32 caratteri
npm run dev
```

Apri http://localhost:3000. Al primo avvio il database viene creato e riempito con i pet di esempio.

Per ripartire da zero: ferma il server e cancella la cartella `sites/pets/.data/`.

### Immagini su Cloudflare R2

Di base le immagini stanno su disco in `sites/<sito>/.data/uploads`. Con le quattro chiavi `R2_*` nel `.env` del sito (vedi `.env.example`) vanno nel suo bucket R2: lo decide all'avvio `layers/core/server/plugins/uploads.ts`, e il resto del codice non cambia. Il bucket resta privato: le immagini passano sempre dalle rotte del sito, così quelle in attesa di approvazione non si vedono.

Per copiare nel bucket le immagini già caricate (si può rilanciare, salta quelle già presenti):

```bash
npm run upload-to-r2 -- furry
```

### Diventare moderatore

1. Registrati dal sito.
2. Ferma il server e lancia `npm run make-admin -- <tuo-username>` (per un altro sito: `npm run make-admin -- <tuo-username> <sito>`).
3. Riavvia, esci e rientra: compare la voce **Moderazione** (su mobile si apre dal profilo, insieme a **Gestisci sfide**).
4. Il pannello si apre solo con la **verifica in due passaggi**: attivala da `/account` con un'app di autenticazione (Google Authenticator, 2FAS, Aegis…) e salva i 10 codici di emergenza. Se perdi telefono e codici, a server fermo: `UPDATE users SET totp_secret = NULL, totp_enabled_at = NULL, totp_recovery = '[]' WHERE username = '<tuo-username>';` e riattivala.

## Come funziona

- **Account**: email + password (hash scrypt). Votare non richiede l'account, caricare sì. Per iscriversi bisogna accettare le regole della community (`/rules`): gentilezza, solo cose proprie o con permesso, niente immagini fatte con l'IA, niente dati personali. Chi si era iscritto prima le trova in un riquadro al primo accesso.
- **Pet e gallery**: ogni utente ha un profilo `/u/<username>` con un riquadro per pet e tutte le sue foto. Ogni pet ha anche la sua pagina `/pet/<id>`.
- **Coda di approvazione**: ogni foto nasce "in attesa" ed è visibile solo al proprietario e ai moderatori. Approvata diventa pubblica ed entra nei duelli; rifiutata viene cancellata e al proprietario resta il motivo. Massimo 10 foto in attesa per utente.
- **Duelli**: solo pet con almeno una foto approvata, mai i propri, sempre tra animali della stessa specie (cani, gatti, conigli, roditori, uccelli, rettili, altri). A ogni duello esce una foto a caso della gallery.
- **Classifiche**: `/leaderboard` e `/leaderboard/<categoria>` (es. `/leaderboard/cats`), con periodo `?period=week|month|all|new`. "Nuovi" (Nuovi talenti) conta solo i pet creati negli ultimi 30 giorni. Settimana e mese contano i punti Elo guadagnati nel periodo e si azzerano lunedì e il primo del mese (ora italiana); "all" usa l'Elo totale. Chi ha un account vede i propri pet evidenziati, anche fuori dalla top 50. La pagina del pet mostra la posizione tra quelli della sua specie.
- **Segnalazioni**: chi è collegato può segnalare un'immagine pubblicata (dal visore a tutto schermo) o un profilo, con un motivo e una nota; massimo 20 al giorno. I moderatori le trovano in `/admin/reports`, raggruppate per cosa segnalata (prima quelle fatte dall'artista indicato): possono lasciar stare, togliere l'immagine (il proprietario riceve il motivo) o sospendere il profilo. Chi ha segnalato riceve un avviso, senza sapere cosa è successo all'altra persona.
- **Salta**: nel duello si può passare alla coppia dopo senza votare. **Votati da te** (`/voted`, anche senza account) elenca gli ultimi 60 pet scelti nei duelli e nelle sfide, con il link al profilo del proprietario, all'artista e alla sfida.
- **Segui e preferiti**: dal profilo di un utente lo si può seguire; `/following` mostra le sue immagini nuove (caricate da lui o che lo indicano come artista) e chi lo segue riceve al massimo un avviso al giorno. Il numero di chi ti segue lo vedi solo tu. Dalla pagina di un pet si può salvarlo tra i preferiti (`/favorites`), che restano privati.
- **Commissioni** (siti con artisti): dalla pagina account l'artista dice se ha le commissioni aperte, con il link dove chiederle, o chiuse; compare sul profilo.
- **Complimenti**: sulla pagina di un pet chi è collegato può lasciare complimenti predefiniti (😍 ✨ 🎨 😊 💡), senza testo libero. I conteggi li vedono solo il proprietario e gli artisti collegati, che ricevono un avviso al giorno.
- **Blocchi**: dal profilo di un utente lo si può bloccare (si gestiscono in `/account`). Non si vedono più i suoi pet nei duelli né nella lista dei votati, e nessuno dei due può collegare l'altro come artista o fargli complimenti.
- **Motivi di rifiuto gentili**: il proprietario riceve il motivo con un consiglio su cosa cambiare (anche nella gallery). Tra i motivi c'è "Generata con IA", anche tra quelli delle segnalazioni.
- **Avvisi programmati**: ogni 15 minuti il server prepara gli avvisi di tutti (risultati delle sfide, cuori della settimana, classifica), così arrivano anche a chi non apre la campanella ([server/plugins/notifications.ts](layers/core/server/plugins/notifications.ts)). Con più server va spostato in un job unico.
- **Sfide settimanali**: `/challenges`. Ogni lunedì a mezzanotte (ora italiana) parte un tema nuovo dal calendario automatico (12 temi, alcuni solo per cani o solo per gatti) e dura 7 giorni. Si partecipa da `/challenges/<slug>?tab=join` con una foto già approvata della gallery o con una foto nuova, che passa dalla coda di approvazione (il moderatore vede per quale sfida è e può rifiutarla come "Non in tema"). Un pet per sfida, solo della specie richiesta. I voti della sfida hanno un Elo separato da quello generale; a fine settimana il primo vince un trofeo che compare nella sua gallery e nell'albo d'oro. Gli admin possono programmare sfide proprie da `/admin/challenges`: sostituiscono quella automatica dello stesso periodo se non ha ancora partecipanti.
- **Card da condividere**: sulla pagina di ogni pet c'è **Condividi**, e chi è in gara in una sfida ha **Chiedi voti**. Si apre l'anteprima di una card verticale per le storie (1080×1920) con foto, nome, posizione e trofeo; si può condividere direttamente (su telefono, con il menu di condivisione del sistema), scaricare o copiare il link. Il link `/pet/<id>` (con `?challenge=<slug>` se viene da una sfida; sul sito furry `/character/<id>`) mostra in chat e sui social un'anteprima orizzontale (1200×630). Le immagini sono disegnate dal server in `/card/<id>.png?format=story|og` (satori + resvg, font in `server/assets/fonts`) e solo per pet con foto approvate.
- **Pet di esempio**: circa 66 pet con foto vere a licenza libera da Wikimedia Commons, divisi per specie. Sono in `sites/pets/server/assets/seed` e finiscono nel database al primo avvio. Autore e licenza di ogni foto compaiono sulla foto stessa e nella pagina `/credits`. Per rifare la selezione: `node scripts/commons/discover.mjs <cartella>` crea dei provini numerati per specie; le foto scelte vanno in `scripts/commons/pets.json`; `node scripts/commons/import.mjs` le scarica e le ritaglia. Poi si cancella `sites/pets/.data` per ricreare il database. Per un altro sito si passa il suo nome: `node scripts/commons/discover.mjs <cartella> moto`, le foto scelte in `scripts/commons/moto.json`, `node scripts/commons/import.mjs moto`. Le moto sono larghe e un ritaglio verticale le taglierebbe: per loro si salva la foto intera con i tre ritagli (verticale, orizzontale, quadrato) scelti in automatico sul soggetto, correggibili a mano nel JSON, e il sito crea le varianti al primo avvio.

## Prove

- `npm test`: funzioni pure (classifiche, abbinamenti, pubblicità, regole anti-brigate, schemi) e compilazione di tutti i testi tradotti.
- `npm run smoke`: con il sito furry acceso in locale, prova segui, preferiti, blocchi e complimenti con gli account di prova di `sites/furry/.data/account-di-prova.txt`, poi rimette tutto com'era.

## Sicurezza

| Rischio | Difesa |
| --- | --- |
| Password rubate dal DB | Hash scrypt (`nuxt-auth-utils`), mai salvate in chiaro |
| Brute force sul login | Al massimo 8 tentativi sbagliati ogni 15 minuti per account e 30 per rete, contati nel database ([server/utils/rateLimit.ts](layers/core/server/utils/rateLimit.ts)); in più 10 richieste ogni 15 minuti per IP su `/api/auth/*`. Stesso messaggio e stesso tempo di risposta che l'email esista o no. Al massimo 8 account nuovi al giorno dalla stessa rete |
| Furto di sessione | Cookie cifrato, `HttpOnly`, `SameSite=Lax`, `Secure` in produzione. In `/account` si cambia la password o si esce dagli altri dispositivi: le altre sessioni smettono subito di valere (`users.session_version`). Anche la conferma della password dentro l'account ha un limite di tentativi |
| Password di un admin rubata | Verifica in due passaggi obbligatoria per gli admin: le API admin rispondono 403 finché non è attiva, e attivarla chiude le altre sessioni. Codici TOTP (RFC 6238) usabili una volta sola, segreto cifrato nel database con `NUXT_TOTP_KEY` (o la chiave delle sessioni), 10 codici di emergenza salvati come impronte ([server/utils/totp.ts](layers/core/server/utils/totp.ts)). I codici sbagliati contano come password sbagliate. Facoltativa per tutti gli altri |
| CSRF | Ogni POST/DELETE su `/api` deve avere `Origin` uguale al sito ([server/middleware/origin.ts](layers/core/server/middleware/origin.ts)) |
| XSS | Vue fa l'escape di tutto, `v-html` solo per il QR della verifica in due passaggi (SVG fatto dal server); CSP con nonce, `X-Frame-Options: DENY`, `nosniff` (`nuxt-security`) |
| SQL injection | Solo query parametrizzate (Drizzle) |
| File malevoli | Si accettano solo JPEG, PNG, WebP e HEIC/AVIF, riconosciuti dai primi byte prima di aprirli: SVG, TIFF, GIF e PDF non arrivano mai ai decoder ([server/utils/uploadFormat.ts](layers/core/server/utils/uploadFormat.ts)). Poi `sharp` decodifica e ricodifica in WebP: metadati (GPS compreso) e payload nascosti spariscono. Limite 10 MB e 50 megapixel |
| Foto non approvate | Servite solo a proprietario e moderatori, mai in cache pubblica |
| Accessi non autorizzati | Ogni API controlla lato server proprietario e ruolo; utente e ruolo si rileggono dal DB a ogni richiesta (anche nelle pagine pubbliche che mostrano di più al proprietario e nei voti), quindi un account eliminato, sospeso o declassato perde subito l'accesso |
| Voti truccati | Token firmato per coppia (legato a duelli o alla singola sfida), un voto per coppia per votante, minimo 300 ms tra coppia e voto; i propri pet non compaiono mai |
| Brigate di voti | Account con meno di 3 giorni pesano metà; massimo 400 voti al giorno per account e 100 senza account per rete; più di 10 voti in un'ora per lo stesso pet dalla stessa rete non contano e finiscono tra i "Voti sospetti" in `/admin/reports`. I contatori stanno nel database: valgono dopo un riavvio e con più server |
| Abusi in generale | Rate limit globale per IP (in memoria: contro le raffiche vere serve Cloudflare), limite dimensione richieste; le richieste a `/api` senza `Content-Length` sono rifiutate, così il limite non si aggira ([server/middleware/body-length.ts](layers/core/server/middleware/body-length.ts)) |

Da fare prima di andare online: HTTPS, Postgres gestito con backup, un servizio email per verifica dell'indirizzo e recupero password (`NUXT_SMTP_URL`), verifica in due passaggi attiva sugli account admin, Cloudflare davanti al sito, `npm audit` periodico.

**Proxy davanti al server.** I limiti per rete usano l'indirizzo della connessione. Dietro un proxy va detto nel `.env` da dove prendere l'IP vero: `NUXT_CLIENT_IP_HEADER` (es. `cf-connecting-ip` con Cloudflare) oppure `NUXT_TRUSTED_PROXY_HOPS` (quanti proxy aggiungono il loro pezzo in fondo a `X-Forwarded-For`). Il server deve essere raggiungibile solo dal proxy, che riscrive quegli header: altrimenti chiunque potrebbe mandarli falsi. Il controllo CSRF confronta `Origin` con `X-Forwarded-Host`, che va quindi riscritto dal proxy.

## Struttura

I percorsi qui sotto sono dentro `layers/core/`.

| Percorso | Cosa fa |
| --- | --- |
| `app/pages/index.vue` | Duelli: carica la coppia successiva in anticipo |
| `app/components/DuelArena.vue` | Gesto "trascina sopra l'altro", frecce animate, demo iniziale, tastiera |
| `app/pages/u/[username].vue`, `app/components/PetGallery.vue` | Profilo con gallery per pet |
| `app/pages/upload.vue` | Nuovo pet o nuova foto per un pet esistente |
| `app/pages/admin.vue`, `app/pages/admin/*` | Pannello admin: panoramica, foto, segnalazioni, utenti, rifugi, sfide, pubblicità |
| `server/utils/ads.ts`, `app/components/AdCard.vue` | Pubblicità custom tra un duello e l'altro, con visualizzazioni e clic |
| `app/pages/challenges/*`, `app/pages/admin/challenges.vue` | Sfide settimanali e gestione admin |
| `server/utils/cards.ts`, `app/components/ShareCard.vue` | Card da condividere e anteprime dei link |
| `server/utils/challenges.ts` | Calendario dei temi, creazione automatica, classifica e trofei delle sfide |
| `server/api/auth/*` | Registrazione, login, logout |
| `server/api/admin/*` | API dell'admin (solo ruolo admin) |
| `server/utils/photos.ts` | Upload sicuro e limite di foto in attesa |
| `server/utils/ranking.ts` | Elo e criteri di scelta della coppia |
| `server/db/schema.ts` | Tabelle `users`, `pets`, `photos`, `votes` (Drizzle) |
