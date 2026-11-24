declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    role: 'user' | 'admin'
    // Iscritto prima che ci fossero le regole: gliele si chiede una volta
    needsRules?: boolean
    // Versione delle sessioni dell'account (users.session_version): se nel database è più alta, questa non vale più.
    // Assente nelle sessioni aperte prima che esistesse: vale 0
    sessionVersion?: number
    // Ha confermato l'email aprendo il link ricevuto. Assente nelle sessioni aperte prima: si aggiorna alla prossima lettura
    emailVerified?: boolean
    // Codice della sessione, per chiuderla all'uscita. Assente nelle sessioni aperte prima: valgono fino alla scadenza
    sid?: string
  }

  interface UserSession {
    // Chi vota: "u:<id>" se ha un account, altrimenti un id anonimo
    voterId?: string
    // Ultimi pet mostrati, per non riproporli subito
    recent?: number[]
  }
}

export {}
