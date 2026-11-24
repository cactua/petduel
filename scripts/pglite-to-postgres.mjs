// Copia tutto il database PGlite di un sito in PostgreSQL (una volta, al passaggio alla produzione).
// Uso, a server spento: node scripts/pglite-to-postgres.mjs <sito> [--force]
// L'indirizzo di PostgreSQL arriva da DATABASE_URL (ambiente o sites/<sito>/.env). Il database di arrivo deve
// essere vuoto: con --force si accetta anche se ha già dati, ma le righe con lo stesso id fanno fallire la copia.
// Le foto restano dove sono (cartella uploads o R2): qui passano solo i dati
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { databaseUrl, openDb } from './db.mjs'

const site = process.argv[2]
const force = process.argv.includes('--force')
if (!site || site.startsWith('-')) {
  console.error('Uso: node scripts/pglite-to-postgres.mjs <sito> [--force]')
  process.exit(1)
}
if (!databaseUrl(site)) {
  console.error(`Manca DATABASE_URL (nell'ambiente o in sites/${site}/.env).`)
  process.exit(1)
}

// Le tabelle si creano con lo stesso SQL che usa il sito all'avvio
const jiti = createJiti(import.meta.url, { alias: { '#shared': fileURLToPath(new URL('../layers/core/shared', import.meta.url)) } })
const { CREATE_TABLES_SQL } = await jiti.import('../layers/core/server/db/schema.ts')

const from = await openDb(site, { forcePglite: true })
const to = await openDb(site)
const q = (db, text, params) => db.query(text, params).then(r => r.rows)

try {
  await to.query(CREATE_TABLES_SQL)
  const [{ n }] = await q(to, 'select (select count(*) from users)::int + (select count(*) from pets)::int as n')
  if (n > 0 && !force) throw new Error('Il database PostgreSQL ha già utenti o partecipanti. Usa --force solo se sai cosa fai.')

  const tables = (await q(from, `select table_name as t from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`)).map(r => r.t)
  // Chiavi esterne: tabella, colonna, tabella a cui punta
  const fks = await q(from, `select kcu.table_name as t, kcu.column_name as c, ccu.table_name as ref
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`)
  const columns = await q(from, `select table_name as t, column_name as c, data_type as type, is_nullable = 'YES' as nullable
    from information_schema.columns where table_schema = 'public' order by ordinal_position`)
  const pks = await q(from, `select kcu.table_name as t, kcu.column_name as c from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'`)

  // Ordine: prima le tabelle a cui le altre puntano. Nei giri (users → photos → pets → users) e nei riferimenti
  // alla stessa tabella la colonna si copia vuota e si riempie alla fine
  const done = new Set()
  const order = []
  const deferred = [] // { t, c }
  while (order.length < tables.length) {
    const left = tables.filter(t => !done.has(t))
    const pending = t => fks.filter(f => f.t === t && (f.ref === t || !done.has(f.ref)))
    // Nei giri si sceglie una tabella le cui colonne da rimandare possono restare vuote per un attimo
    const nullable = f => columns.find(c => c.t === f.t && c.c === f.c)?.nullable
    const next = left.find(t => pending(t).every(f => f.ref === t))
      ?? left.filter(t => pending(t).every(nullable)).sort((a, b) => pending(a).length - pending(b).length)[0]
    if (!next) throw new Error(`Riferimenti circolari obbligatori tra: ${left.join(', ')}`)
    for (const f of pending(next)) deferred.push({ t: f.t, c: f.c })
    done.add(next)
    order.push(next)
  }

  const ident = s => `"${s.replaceAll('"', '""')}"`
  console.log(`Copio ${order.length} tabelle da PGlite a PostgreSQL…`)
  for (const t of order) {
    const cols = columns.filter(c => c.t === t)
    const later = new Set(deferred.filter(d => d.t === t).map(d => d.c))
    const rows = await q(from, `select * from ${ident(t)}`)
    // JSON: si passa come testo, altrimenti pg trasformerebbe le liste in array di PostgreSQL
    const value = (col, v) => (v !== null && (col.type === 'jsonb' || col.type === 'json') ? JSON.stringify(v) : v)
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200)
      const params = []
      const tuples = batch.map(r => `(${cols.map((col) => {
        params.push(later.has(col.c) ? null : value(col, r[col.c]))
        return `$${params.length}`
      }).join(', ')})`)
      await to.query(`insert into ${ident(t)} (${cols.map(c => ident(c.c)).join(', ')}) values ${tuples.join(', ')}`, params)
    }
    console.log(`  ${t}: ${rows.length}`)
  }

  // Colonne rimandate: ora che ci sono tutte le righe a cui puntano
  for (const { t, c } of deferred) {
    const pk = pks.filter(p => p.t === t).map(p => p.c)
    if (!pk.length) throw new Error(`La tabella ${t} non ha chiave primaria: non so riempire ${c}`)
    const rows = await q(from, `select ${pk.map(ident).join(', ')}, ${ident(c)} as v from ${ident(t)} where ${ident(c)} is not null`)
    for (const r of rows) {
      await to.query(`update ${ident(t)} set ${ident(c)} = $1 where ${pk.map((p, i) => `${ident(p)} = $${i + 2}`).join(' and ')}`, [r.v, ...pk.map(p => r[p])])
    }
  }

  // I contatori degli id ripartono dopo l'ultimo copiato
  const serials = await q(to, `select table_name as t, column_name as c from information_schema.columns
    where table_schema = 'public' and column_default like 'nextval(%'`)
  for (const { t, c } of serials) {
    await to.query(`select setval(pg_get_serial_sequence($1, $2), coalesce((select max(${ident(c)}) from ${ident(t)}), 0) + 1, false)`, [t, c])
  }
  console.log('Fatto. Avvia il sito con DATABASE_URL e controlla che tutto ci sia.')
}
catch (e) {
  console.error(`Copia non riuscita: ${e.message}`)
  process.exitCode = 1
}
finally {
  await from.close()
  await to.close()
}
