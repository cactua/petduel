import { NEW_ACCOUNT_VOTE_WEIGHT } from './models'

// Regole anti-brigate dei voti, senza server né database: le usa server/utils/voter.ts e si testano da sole

// Anche con l'account: oltre questo tetto giornaliero i voti restano registrati ma non spostano l'Elo
export const USER_DAILY_CAP = 400
// Un account appena creato vota a metà peso per i primi giorni: crearne tanti per spingere qualcuno non conviene
export const NEW_ACCOUNT_DAYS = 3
// Raffiche: più di BURST_LIMIT voti per lo stesso partecipante dalla stessa rete nella stessa finestra di BURST_WINDOW_MS
export const BURST_WINDOW_MS = 60 * 60 * 1000
export const BURST_LIMIT = 10

const DAY_MS = 86_400_000

/** Peso del voto di un utente: `votesToday` conta anche questo voto, `createdAt` vuoto = account sparito (peso ridotto) */
export function accountVoteWeight(votesToday: number, createdAt: Date | null, now = Date.now()) {
  if (votesToday > USER_DAILY_CAP) return 0
  const young = !createdAt || now - createdAt.getTime() < NEW_ACCOUNT_DAYS * DAY_MS
  return young ? NEW_ACCOUNT_VOTE_WEIGHT : 1
}

/** Finestra delle raffiche in cui cade un istante: i voti si contano per finestra */
export const burstWindow = (now = Date.now()) => Math.floor(now / BURST_WINDOW_MS)

/** `count` sono i voti della stessa rete per lo stesso partecipante nella finestra, compreso questo */
export const isBurst = (count: number) => count > BURST_LIMIT
