declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    role: 'user' | 'admin'
    // Iscritto prima che ci fossero le regole: gliele si chiede una volta
    needsRules?: boolean
  }

  interface UserSession {
    // Chi vota: "u:<id>" se ha un account, altrimenti un id anonimo
    voterId?: string
    // Ultimi pet mostrati, per non riproporli subito
    recent?: number[]
  }
}

export {}
