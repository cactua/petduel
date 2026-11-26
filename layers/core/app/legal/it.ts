import type { LegalTexts } from './types'

export default {
  updated: 'Ultimo aggiornamento: {date}',
  missing: 'da completare',
  seeAlso: 'Vedi anche',
  docs: {
    privacy: {
      title: 'Informativa sulla privacy',
      intro: 'Qui spieghiamo quali dati raccoglie {site}, perché li usa, chi può vederli e come puoi controllarli. Abbiamo cercato di raccogliere solo quello che serve davvero.',
      sections: [
        {
          h: 'Chi è il titolare',
          p: ['Il titolare del trattamento è {owner}. Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti scrivi a {email}.'],
        },
        {
          h: 'Quali dati raccogliamo',
          list: [
            'Account: email, nome utente e password. La password è salvata solo in forma cifrata: nessuno può leggerla, nemmeno noi. Ti scriviamo all\'email solo per confermarla, per il recupero della password e per l\'esito delle segnalazioni.',
            'Profilo: bio, pronomi, avatar e immagine di copertina, se li aggiungi.',
            { only: ['pets'], t: 'Pet e foto: nome, specie, razza, città e le foto che carichi.' },
            { only: ['furry'], t: 'Personaggi e disegni: nome, specie, la scheda del personaggio (pronomi, colori, regole per chi lo disegna) e le immagini che carichi, con il nome e il link dell\'artista se li indichi.' },
            { only: ['moto'], t: 'Moto e foto: nome, tipo di moto, marca e modello, città e le foto che carichi.' },
            { only: ['artists'], t: 'Profilo artista: se ti segni come artista, i link alle tue pagine, lo stato delle commissioni e le immagini in cui altre persone ti indicano come autore.' },
            'Voti: quali immagini hai scelto nei duelli. Se hai un account il voto è legato al tuo profilo; se non ce l\'hai, a un codice anonimo salvato in un cookie tecnico.',
            'Attività nel sito: chi segui, i preferiti, i complimenti che fai e le persone che blocchi.',
            'Segnalazioni: il motivo e il testo che scrivi. Se segnali senza account, anche l\'email che lasci per ricevere la risposta.',
            { only: ['shelters'], t: 'Rifugi: nome, città, descrizione, sito, codice fiscale, email e telefono di contatto, e i dati per le donazioni (IBAN e link). Codice fiscale, email e telefono di contatto li vedono solo i moderatori e il rifugio stesso.' },
            { only: ['shelters'], t: 'Richieste di adozione: il messaggio e il telefono (facoltativo) che scrivi a un rifugio.' },
            'Avvisi e notifiche: le notifiche nella campanella. Se attivi le notifiche push, salviamo l\'indirizzo che il tuo browser ci dà per il suo servizio di notifiche e la lingua in cui riceverle.',
            'Dati tecnici: lingua del browser e posizione approssimativa (paese e città) ricavata dall\'indirizzo IP dalla rete che protegge il sito. L\'indirizzo IP non lo salviamo in chiaro: ne teniamo solo un\'impronta cifrata, che non permette di risalire all\'indirizzo, per limitare voti automatici, iscrizioni in serie e tentativi di accesso.',
            'Annunci: quando vedi o clicchi un annuncio salviamo l\'evento con un\'impronta cifrata del tuo codice di voto o del tuo account, il paese, la città e la lingua, per contare visualizzazioni, clic e quante volte al giorno vedi lo stesso annuncio.',
          ],
        },
        {
          h: 'Perché li usiamo',
          list: [
            { only: ['pets'], t: 'Per farti usare il servizio: account, pet, duelli, classifiche, sfide e adozioni (esecuzione del contratto).' },
            { only: ['furry'], t: 'Per farti usare il servizio: account, personaggi, duelli, classifiche, sfide e crediti agli artisti (esecuzione del contratto).' },
            { only: ['moto'], t: 'Per farti usare il servizio: account, moto, duelli, classifiche e sfide (esecuzione del contratto).' },
            'Per la sicurezza: bloccare bot, voti falsi, account in serie e contenuti vietati, moderare le immagini, gestire le segnalazioni e tenere traccia delle azioni dei moderatori (legittimo interesse e obblighi del Regolamento europeo sui servizi digitali).',
            'Per mostrare annunci dei nostri inserzionisti scelti in base a zona, lingua e orario, senza profilarti (legittimo interesse).',
            'Per mostrare annunci di Google che usano cookie, solo se accetti nel banner (consenso).',
            'Per mandarti le notifiche push, solo se le attivi (consenso, che ritiri spegnendole).',
            { only: ['shelters'], t: 'Per verificare i rifugi e i loro dati per le donazioni prima di renderli pubblici (legittimo interesse e tutela degli animali e di chi dona).' },
          ],
        },
        {
          h: 'Cosa vedono gli altri',
          p: [
            { only: ['pets'], t: 'Sono pubblici il tuo nome utente, il profilo (bio, pronomi, avatar), i tuoi pet con nome, razza e città, le foto approvate, il numero di voti che hai dato (non quali) e, se gestisci un rifugio verificato, la sua pagina pubblica con i dati per le donazioni.' },
            { only: ['furry'], t: 'Sono pubblici il tuo nome utente, il profilo (bio, pronomi, avatar), i tuoi personaggi con la loro scheda, le immagini approvate con il nome dell\'artista, il profilo artista se lo attivi e il numero di voti che hai dato (non quali).' },
            { only: ['moto'], t: 'Sono pubblici il tuo nome utente, il profilo (bio, pronomi, avatar), le tue moto con marca, modello e città, le foto approvate e il numero di voti che hai dato (non quali).' },
            'Non sono pubblici la tua email, quali immagini hai votato, le segnalazioni che fai, chi blocchi e i cuori che ricevono i tuoi partecipanti fuori dalla top 5.',
          ],
        },
        {
          h: 'Con chi li condividiamo',
          list: [
            'Il fornitore che ospita il sito, il database e le immagini, e quello che protegge il sito dagli attacchi, che trattano i dati solo per nostro conto.',
            'Il fornitore che spedisce le nostre email (conferma dell\'indirizzo, nuova password, esito delle segnalazioni): riceve il tuo indirizzo e il testo dell\'email.',
            'Il servizio di notifiche del tuo browser (Google, Mozilla, Apple o Microsoft), solo se attivi le notifiche push: riceve le notifiche in forma cifrata per recapitarle.',
            { only: ['shelters'], t: 'Il rifugio a cui scrivi una richiesta di adozione: riceve il messaggio, il tuo nome utente, la tua email per risponderti e il telefono se lo indichi.' },
            { only: ['shelters'], t: 'OpenStreetMap: la mappa dei rifugi carica le immagini della mappa dai suoi server, che vedono il tuo indirizzo IP. Quando un rifugio cerca il proprio indirizzo, il testo cercato passa al servizio di ricerca di OpenStreetMap.' },
            'Google, solo se accetti gli annunci di Google: in quel caso Google usa cookie propri, come spiega la sua informativa (policies.google.com/privacy).',
          ],
          p: ['Non vendiamo i tuoi dati a nessuno.'],
        },
        {
          h: 'Dati fuori dall\'Unione europea',
          p: ['Se accetti gli annunci di Google o attivi le notifiche push, alcuni dati possono arrivare negli Stati Uniti (Google, Apple, Microsoft). Questi fornitori aderiscono al Data Privacy Framework UE-USA o usano le clausole contrattuali standard approvate dalla Commissione europea.'],
        },
        {
          h: 'Per quanto tempo',
          p: [
            { only: ['pets'], t: 'Teniamo i dati dell\'account finché l\'account esiste. Quando lo elimini cancelliamo subito profilo, pet, foto (anche i file), rifugio, richieste di adozione, segnalazioni fatte, notifiche e iscrizioni alle notifiche push.' },
            { only: ['furry', 'moto'], t: 'Teniamo i dati dell\'account finché l\'account esiste. Quando lo elimini cancelliamo subito profilo, partecipanti, immagini (anche i file), segnalazioni fatte, notifiche e iscrizioni alle notifiche push.' },
            'I voti che hai dato restano, ma senza più alcun legame con te: servono a non falsare le classifiche degli altri. Lo stesso vale per i conteggi degli annunci.',
            'Le impronte cifrate dell\'IP usate contro gli abusi si cancellano da sole dopo al massimo un giorno; quelle legate a un avviso di voti sospetti restano con l\'avviso, che i moderatori usano per riconoscere abusi ripetuti. I link mandati per email valgono un\'ora (nuova password) o 48 ore (conferma dell\'email). Le segnalazioni fatte senza account le teniamo finché servono a gestirle e a rispondere a eventuali contestazioni.',
          ],
        },
        {
          h: 'I tuoi diritti',
          list: [
            'Vedere e scaricare i tuoi dati: dalla pagina «Il tuo account» scarichi un file con tutto quello che ti riguarda.',
            'Correggerli: profilo e partecipanti si modificano dal sito; per il resto scrivici.',
            'Cancellarli: dalla pagina «Il tuo account» elimini l\'account in qualsiasi momento.',
            'Opporti al trattamento o limitarlo, ritirare il consenso agli annunci di Google dal menu, alla voce «Cookie e annunci», e spegnere le notifiche push dal tuo profilo o dal browser.',
            'Fare reclamo all\'autorità per la protezione dei dati: in Italia il Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Età minima',
          p: ['Per creare un account devi avere almeno 14 anni, e ti chiediamo di confermarlo quando ti iscrivi. Se sei più giovane, chiedi a un genitore di creare l\'account per te. Se scopriamo che un account è di una persona sotto i 14 anni lo eliminiamo.'],
        },
        {
          h: 'Modifiche',
          p: ['Se cambiamo questa informativa aggiorniamo la data in alto. Se le modifiche sono importanti te lo diremo con un avviso nel sito.'],
        },
      ],
    },
    cookie: {
      title: 'Informativa sui cookie',
      intro: 'I cookie sono piccoli file che il sito salva nel tuo browser. {site} ne usa pochi: quasi tutti servono solo a farlo funzionare.',
      sections: [
        {
          h: 'Cookie tecnici',
          p: ['Servono al funzionamento del sito e non richiedono il tuo consenso. Non li usiamo per seguirti su altri siti.'],
          table: {
            head: ['Nome', 'A cosa serve', 'Durata'],
            rows: [
              ['nuxt-session', 'Tenerti collegato e ricordare il codice anonimo dei voti se non hai un account (cifrato)', '30 giorni'],
              ['lang', 'Ricordare la lingua che hai scelto', '1 anno'],
              ['theme', 'Ricordare il tema chiaro o scuro', '1 anno'],
              ['a11y-motion, a11y-contrast, a11y-haptics', 'Ricordare le preferenze di accessibilità: meno animazioni, contrasto alto, vibrazione spenta', '1 anno'],
              ['consent', 'Ricordare la tua scelta sugli annunci di Google', '6 mesi'],
            ],
          },
        },
        {
          h: 'Altri dati salvati nel browser',
          p: ['Oltre ai cookie, il sito salva nel browser qualche informazione tecnica che non esce dal tuo dispositivo:'],
          list: [
            '«petduel:nudge-closed» (memoria locale): ricorda che hai chiuso il suggerimento sotto i duelli. Resta finché non cancelli i dati del sito.',
            'Copia del sito per l\'app installabile (service worker e cache): permette di aprire il sito più in fretta e di ricevere le notifiche push, se le attivi.',
          ],
        },
        {
          h: 'Cookie degli annunci di Google',
          p: [
            'Solo se accetti nel banner, carichiamo gli annunci di Google AdSense. Google usa cookie propri per mostrare annunci, misurarli e personalizzarli in base alla tua attività.',
            'Se rifiuti, lo script di Google non viene caricato affatto: vedi solo gli annunci dei nostri inserzionisti, che non usano cookie.',
            'Come Google usa i dati: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Niente servizi esterni senza motivo',
          p: [
            'I caratteri del sito sono serviti dal sito stesso: aprire una pagina non manda il tuo indirizzo IP a servizi di font esterni.',
            { only: ['shelters'], t: 'La mappa dei rifugi carica le immagini da OpenStreetMap, che non usa cookie ma vede il tuo indirizzo IP.' },
          ],
        },
        {
          h: 'Come cambiare idea',
          p: [
            'Puoi cambiare la tua scelta quando vuoi dal menu in alto a destra, alla voce «Cookie e annunci».',
            'Puoi anche cancellare i cookie dalle impostazioni del browser. Se cancelli i cookie tecnici dovrai accedere di nuovo.',
          ],
        },
        {
          h: 'Contatti',
          p: ['Per domande sui cookie scrivi a {email}.'],
        },
      ],
    },
    terms: {
      title: 'Termini d\'uso',
      intro: [
        { only: ['pets'], t: 'Usando {site} accetti queste regole. Sono pensate per tenere il sito piacevole, giusto e sicuro per persone e animali.' },
        { only: ['furry', 'moto'], t: 'Usando {site} accetti queste regole. Sono pensate per tenere il sito piacevole, giusto e sicuro per tutti.' },
      ],
      sections: [
        {
          h: 'Il servizio',
          p: [
            { only: ['pets'], t: '{site} è un sito gratuito dove si votano le foto di animali a coppie, si partecipa a sfide a tema e si scoprono animali in cerca di casa. È gestito da {owner}.' },
            { only: ['furry'], t: '{site} è un sito gratuito dove si votano a coppie i disegni di personaggi furry, si partecipa a sfide a tema e si danno i crediti agli artisti. È gestito da {owner}.' },
            { only: ['moto'], t: '{site} è un sito gratuito dove si votano a coppie le foto di moto, divise per tipo, e si partecipa a sfide a tema. È gestito da {owner}.' },
            'Per contattarci, anche come autorità o per questioni previste dal Regolamento europeo sui servizi digitali, scrivi a {email}, in italiano o in inglese.',
          ],
        },
        {
          h: 'Il tuo account',
          list: [
            'Devi avere almeno 14 anni.',
            'Un account per persona. Tieni segreta la password: sei responsabile di quello che succede con il tuo account. Se la dimentichi puoi sceglierne una nuova dal link «Password dimenticata?».',
            'Il nome utente non deve imitare altre persone o essere offensivo.',
          ],
        },
        {
          h: 'Le immagini che carichi',
          list: [
            { only: ['pets'], t: 'Carica solo foto scattate da te o che hai il diritto di usare, e solo di animali tuoi o di cui ti occupi.' },
            { only: ['furry'], t: 'Carica solo disegni tuoi, oppure di altri artisti che ti hanno dato il permesso: in quel caso indica l\'artista. Sono vietate le immagini generate con l\'intelligenza artificiale, anche se ritoccate.' },
            { only: ['moto'], t: 'Carica solo foto scattate da te o che hai il diritto di usare. Copri le targhe e non mostrare persone riconoscibili senza il loro consenso.' },
            'Sono vietati contenuti violenti, crudeli, sessuali o d\'odio, dati personali di altri, pubblicità e qualsiasi contenuto illegale.',
            'Le immagini restano tue. Caricandole ci permetti di mostrarle su {site}, nei duelli, nelle classifiche, nelle sfide e nelle card da condividere, finché non le cancelli.',
            'Ogni immagine viene controllata da un moderatore prima di diventare pubblica.',
          ],
        },
        {
          h: 'Segnalazioni e moderazione',
          list: [
            'Chiunque, anche senza account, può segnalare un\'immagine o un profilo con il pulsante «Segnala», spiegando cosa non va. Chi segnala senza account lascia un\'email: gli scriviamo l\'esito.',
            'I moderatori sono persone e decidono in base a queste regole, alle regole della community e alla legge. Non usiamo sistemi automatici per decidere sui contenuti.',
            'Se togliamo o rifiutiamo una tua immagine ti avvisiamo con il motivo. Se sospendiamo il tuo account lo vedi quando provi ad accedere, e puoi chiederci il motivo a {email}. Se non sei d\'accordo con una decisione scrivici: un\'altra persona la riesamina. Restano sempre possibili le vie previste dalla legge.',
            'Chi pubblica spesso contenuti chiaramente illegali, o fa spesso segnalazioni chiaramente infondate, può essere sospeso.',
          ],
        },
        {
          h: 'Diritto d\'autore',
          p: [
            'Se un contenuto usa un tuo lavoro senza permesso, segnalalo con «Segnala» scegliendo «Pubblicata senza permesso», oppure scrivi a {email} indicando il link e perché il lavoro è tuo. Lo togliamo appena verificato.',
            { only: ['artists'], t: 'Se qualcuno ti indica come autore di un disegno che non hai fatto, puoi togliere il tuo nome dalla pagina del tuo profilo («Non sono io»). Se il disegno è tuo ma non avevi dato il permesso, segnalalo da lì: le segnalazioni degli artisti hanno la precedenza.' },
            { only: ['pets', 'moto'], t: 'Le foto di esempio vengono da Wikimedia Commons, con le loro licenze libere: autori e licenze sono nella pagina dei crediti.' },
          ],
        },
        {
          h: 'Voti giusti',
          p: ['Sono vietati bot, voti automatici, account multipli e qualsiasi trucco per gonfiare i cuori di un partecipante. Se succede possiamo annullare i voti, togliere il partecipante dalle classifiche o sospendere l\'account.'],
        },
        {
          h: 'Rifugi, adozioni e donazioni',
          only: ['shelters'],
          list: [
            'I rifugi devono dare informazioni vere, su di sé e sugli animali. Li verifichiamo prima di renderli pubblici, e controlliamo ogni nuovo IBAN o link per le donazioni prima di mostrarlo.',
            'Le adozioni avvengono direttamente tra te e il rifugio. {site} mette in contatto ma non partecipa all\'adozione e non risponde degli accordi presi.',
            'Le donazioni vanno direttamente al rifugio: {site} non le riceve, non trattiene nulla e non può rimborsarle. Prima di donare puoi controllare il rifugio sui suoi canali ufficiali.',
          ],
        },
        {
          h: 'Annunci',
          p: ['Il sito si sostiene con annunci mostrati tra un duello e l\'altro, sempre indicati come pubblicità. Non siamo responsabili dei prodotti e dei siti degli inserzionisti.'],
        },
        {
          h: 'Sospensione e cancellazione',
          p: ['Puoi eliminare il tuo account quando vuoi dalla pagina «Il tuo account». Possiamo sospendere o eliminare gli account che violano queste regole; se succede, ti diciamo il motivo quando ce lo chiedi.'],
        },
        {
          h: 'Responsabilità',
          p: ['Facciamo il possibile perché il sito funzioni bene, ma può avere interruzioni o errori. Nei limiti previsti dalla legge non rispondiamo dei danni indiretti dovuti all\'uso del sito. Restano sempre validi i diritti che la legge riconosce ai consumatori.'],
        },
        {
          h: 'Modifiche e legge applicabile',
          p: [
            'Se cambiamo questi termini aggiorniamo la data in alto e, per le modifiche importanti, te lo diciamo nel sito.',
            'Si applica la legge italiana. Per domande scrivi a {email}.',
          ],
        },
      ],
    },
    accessibility: {
      title: 'Dichiarazione di accessibilità',
      intro: 'Vogliamo che {site} sia facile da usare per tutti, anche per chi usa un lettore di schermo, solo la tastiera, l\'ingrandimento o ha difficoltà con i movimenti fini.',
      sections: [
        {
          h: 'Obiettivo',
          p: ['Seguiamo le linee guida WCAG 2.2 livello AA e la norma europea EN 301 549, come chiede l\'Atto europeo sull\'accessibilità (Direttiva UE 2019/882).'],
        },
        {
          h: 'Stato di conformità',
          p: ['{site} è parzialmente conforme: la maggior parte delle pagine rispetta i requisiti, ma restano i limiti elencati qui sotto.'],
        },
        {
          h: 'Cosa abbiamo fatto',
          list: [
            'Si può votare con il pulsante «Scegli», senza trascinare; da tastiera bastano le frecce.',
            'Link «Vai al contenuto», ordine di tabulazione logico e bordo ben visibile sull\'elemento attivo.',
            'Testi e pulsanti con contrasto di almeno 4,5:1, e pulsanti grandi almeno 44 pixel.',
            'Dal menu puoi scegliere meno animazioni, contrasto alto, tema chiaro o scuro e spegnere la vibrazione.',
            'Il sito funziona con lo zoom del browser fino al 200% e in 5 lingue.',
          ],
        },
        {
          h: 'Limiti noti',
          list: [
            'Le immagini caricate dagli utenti hanno come descrizione il nome e i dati inseriti, non una descrizione completa di cosa mostrano.',
            'Gli annunci pubblicitari arrivano da terzi e potrebbero non rispettare tutti i requisiti.',
          ],
        },
        {
          h: 'Come l\'abbiamo verificato',
          p: ['Con una valutazione interna, fatta con controlli automatici e prove a mano con tastiera e lettore di schermo.'],
        },
        {
          h: 'Segnala un problema',
          p: ['Se trovi una parte del sito che non riesci a usare, scrivici a {email}: rispondiamo entro 30 giorni e, se possibile, ti diamo il contenuto in un altro modo.', 'Se la risposta non ti soddisfa puoi rivolgerti all\'autorità di vigilanza del tuo Paese; in Italia è l\'AgID (Agenzia per l\'Italia Digitale).'],
        },
      ],
    },
  },
} satisfies LegalTexts
