import type { LegalTexts } from './types'

export default {
  updated: 'Zuletzt aktualisiert: {date}',
  missing: 'noch zu ergänzen',
  seeAlso: 'Siehe auch',
  docs: {
    privacy: {
      title: 'Datenschutzerklärung',
      intro: 'Hier erklären wir, welche Daten {site} sammelt, wofür, wer sie sehen kann und wie du sie kontrollierst. Wir sammeln nur, was wirklich nötig ist.',
      sections: [
        {
          h: 'Verantwortlicher',
          p: ['Verantwortlich für die Verarbeitung ist {owner}. Für Fragen zum Datenschutz oder um deine Rechte auszuüben, schreib an {email}.'],
        },
        {
          h: 'Welche Daten wir sammeln',
          list: [
            'Konto: E-Mail, Benutzername und Passwort. Das Passwort wird nur verschlüsselt gespeichert: Niemand kann es lesen, auch wir nicht. Wir schreiben dir nur, um die Adresse zu bestätigen, für ein neues Passwort und für das Ergebnis deiner Meldungen.',
            'Profil: Bio, Pronomen, Avatar und Titelbild, wenn du sie hinzufügst.',
            { only: ['pets'], t: 'Haustiere und Fotos: Name, Tierart, Rasse, Stadt und die Fotos, die du hochlädst.' },
            { only: ['furry'], t: 'Charaktere und Zeichnungen: Name, Spezies, das Charakterblatt (Pronomen, Farben, Regeln für Zeichnende) und die Bilder, die du hochlädst, mit Name und Link der Künstlerin oder des Künstlers, wenn du sie angibst.' },
            { only: ['moto'], t: 'Motorräder und Fotos: Name, Motorradtyp, Marke und Modell, Stadt und die Fotos, die du hochlädst.' },
            { only: ['artists'], t: 'Künstlerprofil: Wenn du dich als Künstler:in einträgst, die Links zu deinen Seiten, der Stand deiner Commissions und die Bilder, bei denen andere dich als Urheber:in angeben.' },
            'Stimmen: welche Bilder du in den Duellen gewählt hast. Mit Konto ist die Stimme mit deinem Profil verknüpft, ohne Konto mit einem anonymen Code in einem technischen Cookie.',
            'Aktivität auf der Seite: wem du folgst, deine Favoriten, deine Komplimente und die Personen, die du blockierst.',
            'Meldungen: der Grund und der Text, den du schreibst. Wenn du ohne Konto meldest, auch die E-Mail für die Antwort.',
            { only: ['shelters'], t: 'Tierheime: Name, Stadt, Beschreibung, Website, Steuernummer, Kontakt-E-Mail und Telefon sowie Spendendaten (IBAN und Link). Steuernummer, Kontakt-E-Mail und Telefon sehen nur die Moderation und das Tierheim selbst.' },
            { only: ['shelters'], t: 'Adoptionsanfragen: die Nachricht und (freiwillig) die Telefonnummer, die du einem Tierheim schickst.' },
            'Hinweise und Benachrichtigungen: die Hinweise unter der Glocke. Wenn du Push-Benachrichtigungen einschaltest, speichern wir die Adresse, die dein Browser für seinen Benachrichtigungsdienst angibt, und die Sprache.',
            'Technische Daten: Browsersprache und ungefährer Standort (Land und Stadt), den das Netzwerk, das die Seite schützt, aus der IP-Adresse ableitet. Die IP-Adresse speichern wir nie im Klartext: Wir behalten nur einen verschlüsselten Fingerabdruck, aus dem sich die Adresse nicht zurückgewinnen lässt, um automatische Stimmen, Massenregistrierungen und Anmeldeversuche zu begrenzen.',
            'Werbung: Wenn du eine Anzeige siehst oder anklickst, speichern wir das Ereignis mit einem verschlüsselten Fingerabdruck deines Abstimmungscodes oder Kontos, Land, Stadt und Sprache, um Aufrufe und Klicks zu zählen und wie oft am Tag du dieselbe Anzeige siehst.',
          ],
        },
        {
          h: 'Wofür wir sie nutzen',
          list: [
            { only: ['pets'], t: 'Damit du den Dienst nutzen kannst: Konto, Haustiere, Duelle, Ranglisten, Challenges und Adoptionen (Vertragserfüllung).' },
            { only: ['furry'], t: 'Damit du den Dienst nutzen kannst: Konto, Charaktere, Duelle, Ranglisten, Challenges und Künstlernennungen (Vertragserfüllung).' },
            { only: ['moto'], t: 'Damit du den Dienst nutzen kannst: Konto, Motorräder, Duelle, Ranglisten und Challenges (Vertragserfüllung).' },
            'Für die Sicherheit: Bots, gefälschte Stimmen, Massenkonten und verbotene Inhalte stoppen, Bilder moderieren, Meldungen bearbeiten und die Aktionen der Moderation protokollieren (berechtigtes Interesse und Pflichten aus dem EU-Gesetz über digitale Dienste).',
            'Um Anzeigen unserer eigenen Werbekunden nach Region, Sprache und Uhrzeit zu zeigen, ohne Profilbildung (berechtigtes Interesse).',
            'Um Google-Anzeigen mit Cookies zu zeigen, nur wenn du im Banner zustimmst (Einwilligung).',
            'Um dir Push-Benachrichtigungen zu schicken, nur wenn du sie einschaltest (Einwilligung, die du durch Ausschalten widerrufst).',
            { only: ['shelters'], t: 'Um Tierheime und ihre Spendendaten zu prüfen, bevor sie öffentlich werden (berechtigtes Interesse und Schutz von Tieren und Spendenden).' },
          ],
        },
        {
          h: 'Was andere sehen',
          p: [
            { only: ['pets'], t: 'Öffentlich sind dein Benutzername, dein Profil (Bio, Pronomen, Avatar), deine Haustiere mit Name, Rasse und Stadt, freigegebene Fotos, die Zahl deiner abgegebenen Stimmen (nicht welche) und, wenn du ein geprüftes Tierheim führst, seine öffentliche Seite mit den Spendendaten.' },
            { only: ['furry'], t: 'Öffentlich sind dein Benutzername, dein Profil (Bio, Pronomen, Avatar), deine Charaktere mit ihrem Blatt, freigegebene Bilder mit dem Namen der Künstler:innen, dein Künstlerprofil, wenn du es einschaltest, und die Zahl deiner abgegebenen Stimmen (nicht welche).' },
            { only: ['moto'], t: 'Öffentlich sind dein Benutzername, dein Profil (Bio, Pronomen, Avatar), deine Motorräder mit Marke, Modell und Stadt, freigegebene Fotos und die Zahl deiner abgegebenen Stimmen (nicht welche).' },
            'Nicht öffentlich sind deine E-Mail, für welche Bilder du gestimmt hast, deine Meldungen, wen du blockierst und die Herzen deiner Beiträge außerhalb der Top 5.',
          ],
        },
        {
          h: 'Mit wem wir sie teilen',
          list: [
            'Die Anbieter, die Website, Datenbank und Bilder hosten, und der Anbieter, der die Seite vor Angriffen schützt; sie verarbeiten die Daten nur in unserem Auftrag.',
            'Der Anbieter, der unsere E-Mails verschickt (Adressbestätigung, neues Passwort, Ergebnis von Meldungen): Er erhält deine Adresse und den Text der E-Mail.',
            'Der Benachrichtigungsdienst deines Browsers (Google, Mozilla, Apple oder Microsoft), nur wenn du Push-Benachrichtigungen einschaltest: Er erhält die Benachrichtigungen verschlüsselt, um sie zuzustellen.',
            { only: ['shelters'], t: 'Das Tierheim, dem du eine Adoptionsanfrage schickst: Es erhält die Nachricht, deinen Benutzernamen, deine E-Mail für die Antwort und deine Telefonnummer, wenn du sie angibst.' },
            { only: ['shelters'], t: 'OpenStreetMap: Die Tierheimkarte lädt Kartenbilder von dessen Servern, die deine IP-Adresse sehen. Wenn ein Tierheim seine Adresse sucht, geht der Suchtext an den Suchdienst von OpenStreetMap.' },
            'Google, nur wenn du Google-Anzeigen akzeptierst: Dann verwendet Google eigene Cookies, wie in seiner Datenschutzerklärung beschrieben (policies.google.com/privacy).',
          ],
          p: ['Wir verkaufen deine Daten an niemanden.'],
        },
        {
          h: 'Daten außerhalb der Europäischen Union',
          p: ['Wenn du Google-Anzeigen akzeptierst oder Push-Benachrichtigungen einschaltest, können einige Daten in die USA gelangen (Google, Apple, Microsoft). Diese Anbieter nehmen am EU-US Data Privacy Framework teil oder nutzen die von der Europäischen Kommission genehmigten Standardvertragsklauseln.'],
        },
        {
          h: 'Wie lange wir sie speichern',
          p: [
            { only: ['pets'], t: 'Kontodaten speichern wir, solange das Konto besteht. Wenn du es löschst, löschen wir sofort Profil, Haustiere, Fotos (auch die Dateien), Tierheim, Adoptionsanfragen, gesendete Meldungen, Hinweise und Push-Abonnements.' },
            { only: ['furry', 'moto'], t: 'Kontodaten speichern wir, solange das Konto besteht. Wenn du es löschst, löschen wir sofort Profil, Beiträge, Bilder (auch die Dateien), gesendete Meldungen, Hinweise und Push-Abonnements.' },
            'Deine abgegebenen Stimmen bleiben, aber ohne jede Verbindung zu dir: So bleiben die Ranglisten der anderen fair. Dasselbe gilt für die Zählung der Anzeigen.',
            'Die verschlüsselten IP-Fingerabdrücke gegen Missbrauch löschen sich nach höchstens einem Tag selbst; die zu einem Hinweis auf verdächtige Stimmen gehörenden bleiben bei diesem Hinweis, mit dem die Moderation wiederholten Missbrauch erkennt. Links per E-Mail gelten eine Stunde (neues Passwort) oder 48 Stunden (E-Mail-Bestätigung). Meldungen ohne Konto behalten wir, solange sie zur Bearbeitung und für mögliche Einwände nötig sind.',
          ],
        },
        {
          h: 'Deine Rechte',
          list: [
            'Deine Daten einsehen und herunterladen: Auf der Seite „Dein Konto“ lädst du eine Datei mit allem herunter, was dich betrifft.',
            'Sie berichtigen: Profil und Beiträge änderst du auf der Seite; für alles andere schreib uns.',
            'Sie löschen: Auf der Seite „Dein Konto“ löschst du das Konto jederzeit.',
            'Der Verarbeitung widersprechen oder sie einschränken, die Einwilligung zu Google-Anzeigen im Menü unter „Cookies und Werbung“ widerrufen und Push-Benachrichtigungen im Profil oder im Browser ausschalten.',
            'Dich bei einer Datenschutzbehörde beschweren: in Italien beim Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Mindestalter',
          p: ['Für ein Konto musst du mindestens 14 Jahre alt sein; das bestätigst du bei der Registrierung. Wenn du jünger bist, bitte ein Elternteil, das Konto für dich anzulegen. Stellen wir fest, dass ein Konto einer Person unter 14 Jahren gehört, löschen wir es.'],
        },
        {
          h: 'Änderungen',
          p: ['Wenn wir diese Erklärung ändern, aktualisieren wir das Datum oben. Über wichtige Änderungen informieren wir dich mit einem Hinweis auf der Seite.'],
        },
      ],
    },
    cookie: {
      title: 'Cookie-Richtlinie',
      intro: 'Cookies sind kleine Dateien, die die Seite in deinem Browser speichert. {site} nutzt nur wenige, und fast alle sind nur für den Betrieb nötig.',
      sections: [
        {
          h: 'Technische Cookies',
          p: ['Sie sind für den Betrieb der Seite nötig und brauchen keine Einwilligung. Wir verwenden sie nicht, um dich auf anderen Seiten zu verfolgen.'],
          table: {
            head: ['Name', 'Zweck', 'Dauer'],
            rows: [
              ['nuxt-session', 'Dich angemeldet halten und deinen anonymen Abstimmungscode merken, wenn du kein Konto hast (verschlüsselt)', '30 Tage'],
              ['lingua', 'Die gewählte Sprache merken', '1 Jahr'],
              ['tema', 'Helles oder dunkles Design merken', '1 Jahr'],
              ['a11y-motion, a11y-contrast, a11y-haptics', 'Deine Barrierefreiheits-Einstellungen merken: weniger Animationen, hoher Kontrast, Vibration aus', '1 Jahr'],
              ['consenso', 'Deine Entscheidung zu Google-Anzeigen merken', '6 Monate'],
            ],
          },
        },
        {
          h: 'Weitere Daten im Browser',
          p: ['Neben Cookies speichert die Seite einige technische Angaben im Browser, die dein Gerät nicht verlassen:'],
          list: [
            '„petduel:nudge-chiuso“ (lokaler Speicher): merkt sich, dass du den Tipp unter den Duellen geschlossen hast. Bleibt, bis du die Daten der Seite löschst.',
            'Eine Kopie der Seite für die installierbare App (Service Worker und Cache): Die Seite öffnet sich schneller, und du kannst Push-Benachrichtigungen erhalten, wenn du sie einschaltest.',
          ],
        },
        {
          h: 'Cookies von Google-Anzeigen',
          p: [
            'Nur wenn du im Banner zustimmst, laden wir Google-AdSense-Anzeigen. Google verwendet eigene Cookies, um Anzeigen zu zeigen, zu messen und nach deiner Aktivität zu personalisieren.',
            'Wenn du ablehnst, wird das Google-Skript gar nicht geladen: Du siehst nur Anzeigen unserer eigenen Werbekunden, die keine Cookies verwenden.',
            'Wie Google Daten nutzt: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Keine externen Dienste ohne Grund',
          p: [
            'Die Schriften der Seite liefert die Seite selbst: Beim Öffnen einer Seite geht deine IP-Adresse nicht an externe Schriftdienste.',
            { only: ['shelters'], t: 'Die Tierheimkarte lädt Bilder von OpenStreetMap, das keine Cookies verwendet, aber deine IP-Adresse sieht.' },
          ],
        },
        {
          h: 'Meinung ändern',
          p: [
            'Du kannst deine Entscheidung jederzeit im Menü oben rechts unter „Cookies und Werbung“ ändern.',
            'Du kannst Cookies auch in den Browsereinstellungen löschen. Wenn du die technischen Cookies löschst, musst du dich neu anmelden.',
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
      intro: [
        { only: ['pets'], t: 'Mit der Nutzung von {site} akzeptierst du diese Regeln. Sie sollen die Seite angenehm, fair und sicher für Menschen und Tiere halten.' },
        { only: ['furry', 'moto'], t: 'Mit der Nutzung von {site} akzeptierst du diese Regeln. Sie sollen die Seite angenehm, fair und sicher für alle halten.' },
      ],
      sections: [
        {
          h: 'Der Dienst',
          p: [
            { only: ['pets'], t: '{site} ist eine kostenlose Seite, auf der man über Tierfotos im Paar abstimmt, an Themen-Challenges teilnimmt und Tiere entdeckt, die ein Zuhause suchen. Betrieben von {owner}.' },
            { only: ['furry'], t: '{site} ist eine kostenlose Seite, auf der man über Zeichnungen von Furry-Charakteren im Paar abstimmt, an Themen-Challenges teilnimmt und Künstler:innen nennt. Betrieben von {owner}.' },
            { only: ['moto'], t: '{site} ist eine kostenlose Seite, auf der man über Motorradfotos im Paar abstimmt, nach Typ sortiert, und an Themen-Challenges teilnimmt. Betrieben von {owner}.' },
            'Um uns zu kontaktieren, auch als Behörde oder in Angelegenheiten nach dem EU-Gesetz über digitale Dienste, schreib an {email}, auf Italienisch oder Englisch.',
          ],
        },
        {
          h: 'Dein Konto',
          list: [
            'Du musst mindestens 14 Jahre alt sein.',
            'Ein Konto pro Person. Halte dein Passwort geheim: Du bist für alles verantwortlich, was mit deinem Konto passiert. Wenn du es vergisst, kannst du über „Passwort vergessen?“ ein neues wählen.',
            'Der Benutzername darf niemanden nachahmen und nicht beleidigend sein.',
          ],
        },
        {
          h: 'Bilder, die du hochlädst',
          list: [
            { only: ['pets'], t: 'Lade nur Fotos hoch, die du selbst gemacht hast oder nutzen darfst, und nur von Tieren, die dir gehören oder um die du dich kümmerst.' },
            { only: ['furry'], t: 'Lade nur eigene Zeichnungen hoch oder solche von Künstler:innen, die es dir erlaubt haben; nenne sie dann. KI-generierte Bilder sind nicht erlaubt, auch nicht überarbeitet.' },
            { only: ['moto'], t: 'Lade nur Fotos hoch, die du selbst gemacht hast oder nutzen darfst. Verdecke Kennzeichen und zeige keine erkennbaren Personen ohne ihre Zustimmung.' },
            'Verboten sind gewalttätige, grausame, sexuelle oder hasserfüllte Inhalte, personenbezogene Daten anderer, Werbung und alle rechtswidrigen Inhalte.',
            'Deine Bilder bleiben deine. Mit dem Hochladen erlaubst du uns, sie auf {site} zu zeigen, in Duellen, Ranglisten, Challenges und Teilen-Karten, bis du sie löschst.',
            'Jedes Bild wird vor der Veröffentlichung von der Moderation geprüft.',
          ],
        },
        {
          h: 'Meldungen und Moderation',
          list: [
            'Alle, auch ohne Konto, können ein Bild oder Profil über „Melden“ melden und erklären, was nicht stimmt. Wer ohne Konto meldet, hinterlässt eine E-Mail; wir schreiben das Ergebnis.',
            'Die Moderation besteht aus Menschen und entscheidet nach diesen Bedingungen, den Community-Regeln und dem Gesetz. Wir verwenden keine automatischen Systeme, um über Inhalte zu entscheiden.',
            'Wenn wir ein Bild von dir entfernen oder ablehnen, sagen wir dir den Grund. Wenn wir dein Konto sperren, siehst du es bei der Anmeldung und kannst uns unter {email} nach dem Grund fragen. Wenn du mit einer Entscheidung nicht einverstanden bist, schreib uns: Eine andere Person prüft sie erneut. Der Rechtsweg bleibt immer offen.',
            'Wer oft offensichtlich rechtswidrige Inhalte veröffentlicht oder oft offensichtlich unbegründete Meldungen schickt, kann gesperrt werden.',
          ],
        },
        {
          h: 'Urheberrecht',
          p: [
            'Wenn ein Inhalt dein Werk ohne Erlaubnis nutzt, melde ihn über „Melden“ mit „Ohne Erlaubnis veröffentlicht“ oder schreib an {email} mit dem Link und warum das Werk von dir ist. Wir entfernen ihn, sobald es geprüft ist.',
            { only: ['artists'], t: 'Wenn dich jemand als Urheber:in einer Zeichnung angibt, die nicht von dir ist, kannst du deinen Namen auf deiner Profilseite entfernen („Bin ich nicht“). Wenn die Zeichnung von dir ist, du sie aber nicht erlaubt hast, melde sie dort: Meldungen von Künstler:innen haben Vorrang.' },
            { only: ['pets', 'moto'], t: 'Die Beispielfotos stammen von Wikimedia Commons unter ihren freien Lizenzen: Urheber und Lizenzen stehen auf der Seite der Bildnachweise.' },
          ],
        },
        {
          h: 'Faire Stimmen',
          p: ['Bots, automatische Stimmen, Mehrfachkonten und jeder Trick, um die Herzen eines Beitrags zu steigern, sind verboten. Dann können wir Stimmen annullieren, den Beitrag aus den Ranglisten nehmen oder das Konto sperren.'],
        },
        {
          h: 'Tierheime, Adoptionen und Spenden',
          only: ['shelters'],
          list: [
            'Tierheime müssen wahre Angaben über sich und die Tiere machen. Wir prüfen sie vor der Veröffentlichung und kontrollieren jede neue IBAN und jeden neuen Spendenlink, bevor wir sie zeigen.',
            'Adoptionen finden direkt zwischen dir und dem Tierheim statt. {site} stellt den Kontakt her, ist aber nicht an der Adoption beteiligt und haftet nicht für getroffene Vereinbarungen.',
            'Spenden gehen direkt an das Tierheim: {site} erhält sie nicht, behält nichts ein und kann sie nicht erstatten. Vor einer Spende kannst du das Tierheim über seine offiziellen Kanäle prüfen.',
          ],
        },
        {
          h: 'Werbung',
          p: ['Die Seite finanziert sich durch Anzeigen zwischen den Duellen, immer als Werbung gekennzeichnet. Für Produkte und Websites der Werbekunden sind wir nicht verantwortlich.'],
        },
        {
          h: 'Sperrung und Löschung',
          p: ['Du kannst dein Konto jederzeit auf der Seite „Dein Konto“ löschen. Wir können Konten sperren oder löschen, die gegen diese Regeln verstoßen; den Grund nennen wir dir, wenn du fragst.'],
        },
        {
          h: 'Haftung',
          p: ['Wir tun unser Bestes, damit die Seite gut funktioniert, aber es kann Ausfälle oder Fehler geben. Soweit gesetzlich zulässig, haften wir nicht für indirekte Schäden aus der Nutzung der Seite. Deine gesetzlichen Verbraucherrechte bleiben immer bestehen.'],
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
    accessibility: {
      title: 'Erklärung zur Barrierefreiheit',
      intro: 'Wir möchten, dass {site} für alle leicht zu benutzen ist, auch mit Screenreader, nur mit Tastatur, mit Vergrößerung oder bei Schwierigkeiten mit feinen Bewegungen.',
      sections: [
        {
          h: 'Ziel',
          p: ['Wir folgen den WCAG 2.2 Stufe AA und der europäischen Norm EN 301 549, wie es der European Accessibility Act (EU-Richtlinie 2019/882) verlangt.'],
        },
        {
          h: 'Stand der Konformität',
          p: ['{site} ist teilweise konform: Die meisten Seiten erfüllen die Anforderungen, die unten genannten Einschränkungen bestehen aber noch.'],
        },
        {
          h: 'Was wir getan haben',
          list: [
            'Du kannst mit der Schaltfläche „Wählen“ abstimmen, ohne zu ziehen; mit der Tastatur reichen die Pfeiltasten.',
            'Link „Zum Inhalt“, logische Tab-Reihenfolge und gut sichtbarer Fokus.',
            'Texte und Schaltflächen mit mindestens 4,5:1 Kontrast und Schaltflächen von mindestens 44 Pixeln.',
            'Im Menü kannst du weniger Animationen, hohen Kontrast, helles oder dunkles Design wählen und die Vibration ausschalten.',
            'Die Seite funktioniert mit Browser-Zoom bis 200 % und in 5 Sprachen.',
          ],
        },
        {
          h: 'Bekannte Einschränkungen',
          list: [
            'Von Nutzern hochgeladene Bilder werden durch Namen und eingegebene Angaben beschrieben, nicht durch eine vollständige Beschreibung des Inhalts.',
            'Werbung stammt von Dritten und erfüllt eventuell nicht alle Anforderungen.',
          ],
        },
        {
          h: 'Wie wir es geprüft haben',
          p: ['Mit einer internen Bewertung, mit automatischen Prüfungen und manuellen Tests mit Tastatur und Screenreader.'],
        },
        {
          h: 'Problem melden',
          p: ['Wenn du einen Teil der Seite nicht nutzen kannst, schreib uns an {email}: Wir antworten innerhalb von 30 Tagen und stellen dir den Inhalt wenn möglich anders bereit.', 'Bist du mit der Antwort nicht zufrieden, kannst du dich an die Marktüberwachungsbehörde deines Landes wenden.'],
        },
      ],
    },
  },
} satisfies LegalTexts
