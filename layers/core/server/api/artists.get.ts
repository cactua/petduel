import { and, asc, eq, isNull, like } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../db/schema'
import { HAS_ARTISTS } from '#shared/models'

const querySchema = z.object({ q: z.string().trim().toLowerCase().min(1).max(30) })

// Artisti registrati il cui username inizia con q: chi carica un disegno ne sceglie uno come autore
export default defineEventHandler(async (event) => {
  if (!HAS_ARTISTS) throw createError({ statusCode: 404 })
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) return []
  // Gli username hanno solo lettere, cifre e "_": il resto non può corrispondere a nessuno
  const q = query.data.q.replace(/[^a-z0-9_]/g, '')
  if (!q) return []
  const db = await useDb()
  const rows = await db.select({ username: users.username }).from(users)
    .where(and(eq(users.isArtist, true), isNull(users.bannedAt), like(users.username, `${q.replaceAll('_', String.raw`\_`)}%`)))
    .orderBy(asc(users.username)).limit(8)
  return rows.map(r => r.username)
})
