import { and, eq, or } from 'drizzle-orm'
import { blocks } from '../db/schema'
import { useDb } from './db'

/** Utenti bloccati da questa persona (per togliere i loro partecipanti dai duelli) */
export async function blockedBy(userId: number) {
  const db = await useDb()
  const rows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId))
  return rows.map(r => r.id)
}

/** true se uno dei due ha bloccato l'altro */
export async function isBlockedBetween(a: number, b: number) {
  const db = await useDb()
  const [row] = await db.select({ id: blocks.blockerId }).from(blocks)
    .where(or(and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)), and(eq(blocks.blockerId, b), eq(blocks.blockedId, a))))
  return !!row
}
