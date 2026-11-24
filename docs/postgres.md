# Passare a PostgreSQL

In sviluppo ogni sito usa **PGlite**: PostgreSQL dentro il processo, salvato in `sites/<sito>/.data/pglite`.
È comodo ma regge **un processo alla volta** (niente script a server acceso, niente più server dietro un bilanciatore).
In produzione si usa un **PostgreSQL vero**: stesso schema, stesse query, cambia solo l'indirizzo.

## 1. Crea un database per sito

Un database per ogni sito (pets, furry, moto), come deciso: account e dati restano separati.
Va bene qualunque PostgreSQL 14 o successivo: gestito (Neon, Supabase, Render, Railway, Scaleway…) o sul tuo server.

## 2. Metti l'indirizzo nel file `.env` del sito

```
DATABASE_URL=postgres://utente:password@host:5432/furryduel?sslmode=require
```

`sslmode=require` serve quasi sempre con i database gestiti. Facoltativi:

- `DATABASE_POOL_MAX`: connessioni aperte per server (10 di default; i piani gratuiti spesso ne permettono 20 in tutto)
- `SEED_DEMO=1`: crea i partecipanti di esempio anche su PostgreSQL (di solito no in produzione)

All'avvio il sito crea da solo tabelle e colonne mancanti, come con PGlite. Se partono più server insieme,
lo fanno uno alla volta.

## 3. Porta i dati che hai già (una volta)

A server **spento** (PGlite non si può leggere mentre il sito lo usa):

```
node scripts/pglite-to-postgres.mjs furry
```

Copia tutte le tabelle nel PostgreSQL di `DATABASE_URL` e rimette a posto i contatori degli id. Il database di arrivo
deve essere vuoto. Le **foto non si spostano**: restano nella cartella uploads o su R2.

## 4. Avvia e controlla

Avvia il sito come sempre: se trova `DATABASE_URL` usa PostgreSQL. Apri home, classifica, un profilo e l'admin.

## Script

- `npm run make-admin -- <utente> <sito>` funziona con tutti e due; con PostgreSQL anche a server acceso.
- `scripts/migrate-challenge-slugs.mjs` è vecchio e lavora solo su PGlite: non serve più.

## Da sapere

- Il limite generale di richieste per IP di nuxt-security sta nella memoria del processo: con più server ognuno conta
  per conto suo. I limiti più importanti (login, voti, caricamenti) stanno già nel database (tabella `rate_limits`).
- Gli avvisi programmati girano ogni 15 minuti su ogni server: non fanno doppioni (ogni avviso ha la sua chiave),
  ma con molti server conviene lasciarli su uno solo.
