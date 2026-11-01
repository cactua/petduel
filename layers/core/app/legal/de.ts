import type { LegalTexts } from './types'

export default {
  updated: 'Zuletzt aktualisiert: {date}',
  missing: 'noch zu ergänzen',
  seeAlso: 'Siehe auch',
  docs: {
    privacy: {
      title: 'Datenschutzerklärung',
      intro: 'Hier erklären wir, welche Daten PetDuel erhebt, wofür, wer sie sehen kann und wie du sie kontrollierst. Wir erheben nur, was wir wirklich brauchen.',
      sections: [
        {
          h: 'Verantwortlicher',
          p: ['Verantwortlich für die Datenverarbeitung ist {owner}. Für Fragen zum Datenschutz oder um deine Rechte auszuüben, schreib an {email}.'],
        },
        {
          h: 'Welche Daten wir erheben',
          list: [
            'Konto: E-Mail, Benutzername und Passwort. Das Passwort wird nur verschlüsselt gespeichert: Niemand kann es lesen, auch wir nicht.',
            'Tiere und Fotos: Name, Tierart, Rasse, Stadt und die Fotos, die du hochlädst.',
            'Stimmen: welche Fotos du in den Duellen gewählt hast. Mit Konto ist die Stimme mit deinem Profil verknüpft, ohne Konto mit einem anonymen Code in einem technischen Cookie.',
            'Tierheime: Name, Stadt, Beschreibung, Website, Steuernummer, Kontakt-E-Mail und Telefon. Steuernummer, E-Mail und Telefon sehen nur die Moderatoren und das Tierheim selbst.',
            'Adoptionsanfragen: die Nachricht und die (freiwillige) Telefonnummer, die du einem Tierheim schickst.',
            'Hinweise: die Benachrichtigungen unter der Glocke.',
            'Technische Daten: Browsersprache und ungefährer Standort (Land und Stadt), abgeleitet aus der IP-Adresse. Die IP-Adresse nutzen wir nur kurz, um automatische Stimmen und Missbrauch zu begrenzen, und speichern sie nicht.',
            'Anzeigen: Wenn du eine Anzeige siehst oder anklickst, speichern wir das Ereignis mit einem anonymen Code, Land, Stadt und Sprache, um Aufrufe und Klicks zu zählen.',
          ],
        },
        {
          h: 'Wofür wir sie nutzen',
          list: [
            'Um den Dienst bereitzustellen: Konto, Tiere, Duelle, Ranglisten, Challenges und Adoptionen (Vertragserfüllung).',
            'Für die Sicherheit: Bots, gefälschte Stimmen und verbotene Inhalte blockieren und Fotos moderieren (berechtigtes Interesse).',
            'Um Anzeigen unserer Werbepartner nach Region, Sprache und Uhrzeit auszuwählen, ohne Profilbildung (berechtigtes Interesse).',
            'Um Google-Anzeigen mit Cookies zu zeigen, nur wenn du im Banner zustimmst (Einwilligung).',
            'Um Tierheime vor der Veröffentlichung zu prüfen (berechtigtes Interesse und Tierschutz).',
          ],
        },
        {
          h: 'Was andere sehen',
          p: [
            'Öffentlich sind dein Benutzername, deine Tiere mit Name, Rasse und Stadt, freigegebene Fotos und, wenn du ein geprüftes Tierheim führst, seine öffentliche Seite.',
            'Nicht öffentlich sind deine E-Mail, deine abgegebenen Stimmen und die Herzen deiner Tiere außerhalb der Top 5: Die siehst nur du.',
          ],
        },
        {
          h: 'An wen wir sie weitergeben',
          list: [
            'Den Anbieter, der Website und Datenbank hostet und die Daten nur in unserem Auftrag verarbeitet.',
            'Das Tierheim, dem du eine Adoptionsanfrage schickst: Es erhält die Nachricht, deinen Benutzernamen, deine E-Mail für die Antwort und deine Telefonnummer, falls angegeben.',
            'Google, nur wenn du Google-Anzeigen zustimmst: Google nutzt dann eigene Cookies, wie in seiner Datenschutzerklärung beschrieben (policies.google.com/privacy).',
          ],
          p: ['Wir verkaufen deine Daten nie.'],
        },
        {
          h: 'Daten außerhalb der Europäischen Union',
          p: ['Wenn du Google-Anzeigen zustimmst, können einige Daten in die USA übermittelt werden. Google nimmt am EU-US Data Privacy Framework teil und nutzt die von der Europäischen Kommission genehmigten Standardvertragsklauseln.'],
        },
        {
          h: 'Speicherdauer',
          p: [
            'Kontodaten speichern wir, solange das Konto besteht. Wenn du es löschst, löschen wir sofort Profil, Tiere, Fotos (auch die Dateien), Tierheim, Adoptionsanfragen und Hinweise.',
            'Deine abgegebenen Stimmen bleiben erhalten, aber ohne jede Verbindung zu dir: So bleiben die Ranglisten der anderen fair. Dasselbe gilt für die Anzeigenstatistik.',
          ],
        },
        {
          h: 'Deine Rechte',
          list: [
            'Deine Daten einsehen und herunterladen: Auf der Seite «Dein Konto» lädst du eine Datei mit allem herunter, was dich betrifft.',
            'Sie berichtigen: Name, Rasse und Stadt der Tiere änderst du im Profil; für alles andere schreib uns.',
            'Sie löschen: Lösch dein Konto jederzeit auf der Seite «Dein Konto».',
            'Der Verarbeitung widersprechen oder sie einschränken, und die Einwilligung zu Google-Anzeigen im Menü unter «Cookies und Werbung» widerrufen.',
            'Dich bei einer Datenschutzbehörde beschweren, zum Beispiel in deinem Land.',
          ],
        },
        {
          h: 'Mindestalter',
          p: ['Für ein Konto musst du mindestens 14 Jahre alt sein. Wenn du jünger bist, bitte einen Elternteil, das Konto für dich anzulegen.'],
        },
        {
          h: 'Änderungen',
          p: ['Wenn wir diese Erklärung ändern, aktualisieren wir das Datum oben. Über wichtige Änderungen informieren wir dich auf der Seite.'],
        },
      ],
    },
    cookie: {
      title: 'Cookie-Richtlinie',
      intro: 'Cookies sind kleine Dateien, die die Seite in deinem Browser speichert. PetDuel nutzt nur wenige, und fast alle sind nur für den Betrieb nötig.',
      sections: [
        {
          h: 'Technische Cookies',
          p: ['Sie sind für den Betrieb der Seite nötig und brauchen keine Einwilligung. Wir nutzen sie nie, um dich auf anderen Seiten zu verfolgen.'],
          table: {
            head: ['Name', 'Zweck', 'Dauer'],
            rows: [
              ['nuxt-session', 'Dich angemeldet halten und den anonymen Abstimmungscode merken, wenn du kein Konto hast (verschlüsselt)', '30 Tage'],
              ['lingua', 'Die gewählte Sprache merken', '1 Jahr'],
              ['tema', 'Helles oder dunkles Design merken', '1 Jahr'],
              ['consenso', 'Deine Wahl zu Google-Anzeigen merken', '6 Monate'],
            ],
          },
        },
        {
          h: 'Cookies der Google-Anzeigen',
          p: [
            'Nur wenn du im Banner zustimmst, laden wir Google-AdSense-Anzeigen. Google nutzt eigene Cookies, um Anzeigen auszuliefern, zu messen und anhand deiner Aktivität zu personalisieren.',
            'Wenn du ablehnst, wird das Google-Skript gar nicht geladen: Du siehst nur Anzeigen unserer eigenen Werbepartner, die keine Cookies nutzen.',
            'Wie Google Daten nutzt: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Deine Wahl ändern',
          p: [
            'Du kannst deine Wahl jederzeit im Menü oben rechts unter «Cookies und Werbung» ändern.',
            'Du kannst Cookies auch in den Browsereinstellungen löschen. Wenn du technische Cookies löschst, musst du dich neu anmelden.',
          ],
        },
        {
          h: 'Kontakt',
          p: ['Für Fragen zu Cookies schreib an {email}.'],
        },
      ],
    },
    terms: {
      title: 'Nutzungsbedingungen',
      intro: 'Mit der Nutzung von PetDuel akzeptierst du diese Regeln. Sie sollen die Seite angenehm, fair und sicher für Menschen und Tiere halten.',
      sections: [
        {
          h: 'Der Dienst',
          p: ['PetDuel ist eine kostenlose Seite, auf der man paarweise über Tierfotos abstimmt, an Themen-Challenges teilnimmt und Tiere entdeckt, die ein Zuhause suchen. Betrieben wird sie von {owner}.'],
        },
        {
          h: 'Dein Konto',
          list: [
            'Du musst mindestens 14 Jahre alt sein.',
            'Ein Konto pro Person. Halte dein Passwort geheim: Du bist verantwortlich für alles, was mit deinem Konto passiert.',
            'Dein Benutzername darf keine anderen Personen nachahmen und nicht beleidigend sein.',
          ],
        },
        {
          h: 'Deine Fotos',
          list: [
            'Lade nur Fotos hoch, die du selbst gemacht hast oder nutzen darfst, und nur von Tieren, die dir gehören oder um die du dich kümmerst.',
            'Verboten sind Fotos mit erkennbaren Personen, gewalttätige, grausame oder sexuelle Inhalte, misshandelte oder gefährdete Tiere, Werbung und beleidigende Texte.',
            'Deine Fotos bleiben deine. Mit dem Hochladen erlaubst du uns, sie auf PetDuel zu zeigen, in Duellen, Ranglisten, Challenges und Teilen-Karten, bis du sie löschst.',
            'Jedes Foto wird vor der Veröffentlichung geprüft. Wir können Fotos ablehnen oder entfernen, die gegen diese Regeln verstoßen.',
          ],
        },
        {
          h: 'Faire Stimmen',
          p: ['Bots, automatische Stimmen, mehrere Konten und jeder Trick, um die Herzen eines Tieres zu erhöhen, sind verboten. In diesem Fall können wir Stimmen annullieren, das Tier aus den Ranglisten nehmen oder das Konto sperren.'],
        },
        {
          h: 'Tierheime und Adoptionen',
          list: [
            'Tierheime müssen wahre Angaben über sich und die Tiere machen. Wir prüfen sie vor der Veröffentlichung.',
            'Adoptionen erfolgen direkt zwischen dir und dem Tierheim. PetDuel stellt den Kontakt her, ist aber nicht an der Adoption beteiligt und haftet nicht für getroffene Vereinbarungen.',
          ],
        },
        {
          h: 'Anzeigen',
          p: ['Die Seite finanziert sich durch Anzeigen zwischen den Duellen. Für Produkte und Websites der Werbepartner sind wir nicht verantwortlich.'],
        },
        {
          h: 'Sperrung und Löschung',
          p: ['Du kannst dein Konto jederzeit auf der Seite «Dein Konto» löschen. Konten, die gegen diese Regeln verstoßen, können wir sperren oder löschen.'],
        },
        {
          h: 'Haftung',
          p: ['Wir tun unser Bestes, damit die Seite gut funktioniert, aber es kann Unterbrechungen oder Fehler geben. Soweit gesetzlich zulässig, haften wir nicht für indirekte Schäden aus der Nutzung der Seite. Die gesetzlichen Verbraucherrechte bleiben immer bestehen.'],
        },
        {
          h: 'Änderungen und anwendbares Recht',
          p: [
            'Wenn wir diese Bedingungen ändern, aktualisieren wir das Datum oben und informieren dich bei wichtigen Änderungen auf der Seite.',
            'Es gilt italienisches Recht. Für Fragen schreib an {email}.',
          ],
        },
      ],
    },
  },
} satisfies LegalTexts
