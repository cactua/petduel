# Idee da valutare

Messe da parte il 30 ottobre 2026, da riprendere prima di andare online.

## Foto fuori dal server: Cloudflare R2
- Oggi le foto stanno in `.data/uploads`, sullo stesso disco dell'app.
- Tutto il codice passa da `useStorage('uploads')`: basta cambiare il driver in `nuxt.config.ts` (`fs` → `s3`) puntandolo a R2.
- R2: niente costi di traffico in uscita (importante per un'app di foto), 10 GB gratis.
- In locale si resta su disco; in produzione R2 con le chiavi nel `.env`.
- Le foto continuano a passare da `server/routes/img`, così quelle in attesa restano private.

## Pre-moderazione automatica: Workers AI
- Al caricamento il server chiede a un modello "vision" di Cloudflare: c'è un animale? Che specie? È adatta? C'entra col tema della sfida?
- Sicura e coerente → approvata subito. Dubbia → in coda con un'etichetta per il moderatore. All'inizio nessun rifiuto automatico.
- Modelli possibili: Clef, Llama 3.2 Vision, Moondream, oppure ResNet-50 (più semplice).
- Da scrivere nella privacy policy: le foto vengono analizzate da Cloudflare.

## Sicurezza: CSAM Scanning Tool
- Gratis, si attiva dalla dashboard Cloudflare quando il sito passa da Cloudflare.

## Da non fare: Cloudflare Images
- sharp crea già ritagli e formati; Images si pagherebbe per avere lo stesso.

## Prima del lancio
- Il database PGlite in `.data/` va spostato su un Postgres gestito (Neon o Supabase).
