import type { LegalTexts } from './types'

export default {
  updated: 'Ultimo aggiornamento: {date}',
  missing: 'da completare',
  seeAlso: 'Vedi anche',
  docs: {
    privacy: {
      title: 'Informativa sulla privacy',
      intro: 'Qui spieghiamo quali dati raccoglie PetDuel, perché li usa, chi può vederli e come puoi controllarli. Abbiamo cercato di raccogliere solo quello che serve davvero.',
      sections: [
        {
          h: 'Chi è il titolare',
          p: ['Il titolare del trattamento è {owner}. Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti scrivi a {email}.'],
        },
        {
          h: 'Quali dati raccogliamo',
          list: [
            'Account: email, nome utente e password. La password è salvata solo in forma cifrata: nessuno può leggerla, nemmeno noi.',
            'Pet e foto: nome, specie, razza, città e le foto che carichi.',
            'Voti: quali foto hai scelto nei duelli. Se hai un account il voto è legato al tuo profilo; se non ce l\'hai, a un codice anonimo salvato in un cookie tecnico.',
            'Rifugi: nome, città, descrizione, sito, codice fiscale, email e telefono di contatto. Codice fiscale, email e telefono li vedono solo i moderatori e il rifugio stesso.',
            'Richieste di adozione: il messaggio e il telefono (facoltativo) che scrivi a un rifugio.',
            'Avvisi: le notifiche che ti mostriamo nella campanella.',
            'Dati tecnici: lingua del browser e posizione approssimativa (paese e città) ricavata dall\'indirizzo IP. L\'indirizzo IP lo usiamo per pochi istanti per limitare voti automatici e abusi, e non lo salviamo.',
            'Annunci: quando vedi o clicchi un annuncio salviamo l\'evento con un codice anonimo, il paese, la città e la lingua, per contare visualizzazioni e clic.',
          ],
        },
        {
          h: 'Perché li usiamo',
          list: [
            'Per farti usare il servizio: account, pet, duelli, classifiche, sfide e adozioni (esecuzione del contratto).',
            'Per la sicurezza: bloccare bot, voti falsi e contenuti vietati, e moderare le foto (legittimo interesse).',
            'Per mostrare annunci dei nostri inserzionisti scelti in base a zona, lingua e orario, senza profilarti (legittimo interesse).',
            'Per mostrare annunci di Google che usano cookie, solo se accetti nel banner (consenso).',
            'Per verificare i rifugi prima di renderli pubblici (legittimo interesse e tutela degli animali).',
          ],
        },
        {
          h: 'Cosa vedono gli altri',
          p: [
            'Sono pubblici il tuo nome utente, i tuoi pet con nome, razza e città, le foto approvate e, se gestisci un rifugio verificato, la sua pagina pubblica.',
            'Non sono pubblici la tua email, i voti che dai e i cuori che ricevono i tuoi pet fuori dalla top 5: quelli li vedi solo tu.',
          ],
        },
        {
          h: 'Con chi li condividiamo',
          list: [
            'Il fornitore che ospita il sito e il database, che tratta i dati solo per nostro conto.',
            'Il rifugio a cui scrivi una richiesta di adozione: riceve il messaggio, il tuo nome utente, la tua email per risponderti e il telefono se lo indichi.',
            'Google, solo se accetti gli annunci di Google: in quel caso Google usa cookie propri, come spiega la sua informativa (policies.google.com/privacy).',
          ],
          p: ['Non vendiamo i tuoi dati a nessuno.'],
        },
        {
          h: 'Dati fuori dall\'Unione europea',
          p: ['Se accetti gli annunci di Google, alcuni dati possono essere trasferiti negli Stati Uniti. Google aderisce al Data Privacy Framework UE-USA e usa le clausole contrattuali standard approvate dalla Commissione europea.'],
        },
        {
          h: 'Per quanto tempo',
          p: [
            'Teniamo i dati dell\'account finché l\'account esiste. Quando lo elimini cancelliamo subito profilo, pet, foto (anche i file), rifugio, richieste di adozione e avvisi.',
            'I voti che hai dato restano, ma senza più alcun legame con te: servono a non falsare le classifiche degli altri. Lo stesso vale per i conteggi degli annunci.',
          ],
        },
        {
          h: 'I tuoi diritti',
          list: [
            'Vedere e scaricare i tuoi dati: dalla pagina «Il tuo account» scarichi un file con tutto quello che ti riguarda.',
            'Correggerli: nome, razza e città dei pet si modificano dal profilo; per il resto scrivici.',
            'Cancellarli: dalla pagina «Il tuo account» elimini l\'account in qualsiasi momento.',
            'Opporti al trattamento o limitarlo, e ritirare il consenso agli annunci di Google dal menu, alla voce «Cookie e annunci».',
            'Fare reclamo all\'autorità per la protezione dei dati: in Italia il Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Età minima',
          p: ['Per creare un account devi avere almeno 14 anni. Se sei più giovane, chiedi a un genitore di creare l\'account per te.'],
        },
        {
          h: 'Modifiche',
          p: ['Se cambiamo questa informativa aggiorniamo la data in alto. Se le modifiche sono importanti te lo diremo con un avviso nel sito.'],
        },
      ],
    },
    cookie: {
      title: 'Informativa sui cookie',
      intro: 'I cookie sono piccoli file che il sito salva nel tuo browser. PetDuel ne usa pochi: quasi tutti servono solo a farlo funzionare.',
      sections: [
        {
          h: 'Cookie tecnici',
          p: ['Servono al funzionamento del sito e non richiedono il tuo consenso. Non li usiamo per seguirti su altri siti.'],
          table: {
            head: ['Nome', 'A cosa serve', 'Durata'],
            rows: [
              ['nuxt-session', 'Tenerti collegato e ricordare il codice anonimo dei voti se non hai un account (cifrato)', '30 giorni'],
              ['lingua', 'Ricordare la lingua che hai scelto', '1 anno'],
              ['tema', 'Ricordare il tema chiaro o scuro', '1 anno'],
              ['consenso', 'Ricordare la tua scelta sugli annunci di Google', '6 mesi'],
            ],
          },
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
      intro: 'Usando PetDuel accetti queste regole. Sono pensate per tenere il sito piacevole, giusto e sicuro per persone e animali.',
      sections: [
        {
          h: 'Il servizio',
          p: ['PetDuel è un sito gratuito dove si votano le foto di animali a coppie, si partecipa a sfide a tema e si scoprono animali in cerca di casa. È gestito da {owner}.'],
        },
        {
          h: 'Il tuo account',
          list: [
            'Devi avere almeno 14 anni.',
            'Un account per persona. Tieni segreta la password: sei responsabile di quello che succede con il tuo account.',
            'Il nome utente non deve imitare altre persone o essere offensivo.',
          ],
        },
        {
          h: 'Le foto che carichi',
          list: [
            'Carica solo foto scattate da te o che hai il diritto di usare, e solo di animali tuoi o di cui ti occupi.',
            'Sono vietate foto con persone riconoscibili, contenuti violenti, crudeli o sessuali, animali maltrattati o in pericolo, pubblicità e scritte offensive.',
            'Le foto restano tue. Caricandole ci permetti di mostrarle su PetDuel, nei duelli, nelle classifiche, nelle sfide e nelle card da condividere, finché non le cancelli.',
            'Ogni foto viene controllata prima di diventare pubblica. Possiamo rifiutare o togliere una foto che non rispetta queste regole.',
          ],
        },
        {
          h: 'Voti giusti',
          p: ['Sono vietati bot, voti automatici, account multipli e qualsiasi trucco per gonfiare i cuori di un pet. Se succede possiamo annullare i voti, togliere il pet dalle classifiche o sospendere l\'account.'],
        },
        {
          h: 'Rifugi e adozioni',
          list: [
            'I rifugi devono dare informazioni vere, su di sé e sugli animali. Li verifichiamo prima di renderli pubblici.',
            'Le adozioni avvengono direttamente tra te e il rifugio. PetDuel mette in contatto ma non partecipa all\'adozione e non risponde degli accordi presi.',
          ],
        },
        {
          h: 'Annunci',
          p: ['Il sito si sostiene con annunci mostrati tra un duello e l\'altro. Non siamo responsabili dei prodotti e dei siti degli inserzionisti.'],
        },
        {
          h: 'Sospensione e cancellazione',
          p: ['Puoi eliminare il tuo account quando vuoi dalla pagina «Il tuo account». Possiamo sospendere o eliminare gli account che violano queste regole.'],
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
  },
} satisfies LegalTexts
