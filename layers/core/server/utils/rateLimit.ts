import { createHmac } from 'node:crypto'
import type { H3Event } from 'h3'
import { eq, lt, sql } from 'drizzle-orm'
import { rateLimits } from '../db/schema'

/**
 * Conta un evento per una chiave in una finestra di tempo fissa e restituisce il totale della finestra.
 * Il contatore sta nel database (tabella rate_limits): vale anche dopo un riavvio e con più server.
 */
export async function hitLimit(key: string, windowMs: number) {
  const db = await useDb()
  const expires = new Date(Date.now() + windowMs)
  const [row] = await db.insert(rateLimits).values({ key, count: 1, expiresAt: expires })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.expiresAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        expiresAt: sql`case when ${rateLimits.expiresAt} <= now() then ${expires} else ${rateLimits.expiresAt} end`,
      },
    })
    .returning({ count: rateLimits.count })
  return row!.count
}

/** Totale della finestra in corso, senza contare un evento nuovo */
export async function peekLimit(key: string) {
  const db = await useDb()
  const [row] = await db.select({ count: rateLimits.count }).from(rateLimits)
    .where(sql`${rateLimits.key} = ${key} and ${rateLimits.expiresAt} > now()`)
  return row?.count ?? 0
}

export async function clearLimit(key: string) {
  const db = await useDb()
  await db.delete(rateLimits).where(eq(rateLimits.key, key))
}

/** Toglie i contatori scaduti; la chiama il job degli avvisi ogni 15 minuti */
export async function purgeLimits() {
  const db = await useDb()
  await db.delete(rateLimits).where(lt(rateLimits.expiresAt, new Date()))
}

/**
 * Impronta della rete di chi fa la richiesta. L'IP non si salva mai in chiaro: solo un HMAC con il segreto
 * dei voti, che basta a riconoscere la stessa rete (è la stessa impronta degli avvisi sulle raffiche)
 */
export function networkOf(event: H3Event) {
  const secret = useRuntimeConfig().voteSecret
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'NUXT_VOTE_SECRET non configurato' })
  // event.context.clientAddress, fissato dal plugin clientIp: X-Forwarded-For vale solo dietro un proxy dichiarato
  const ip = event.context.clientAddress ?? resolveClientIp(event, {})
  return createHmac('sha256', secret).update(`ip:${ip}`).digest('base64url').slice(0, 16)
}
