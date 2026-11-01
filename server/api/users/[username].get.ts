import { count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { pets, users, votes } from '../../db/schema'
import { usernameSchema, type Profile } from '#shared/models'

const paramsSchema = z.object({ username: usernameSchema })

// Profilo pubblico: solo username e pet, mai l'email
export default defineEventHandler(async (event): Promise<Profile> => {
  const parsed = paramsSchema.safeParse(getRouterParams(event))
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })

  const db = await useDb()
  const [profile] = await db.select({ id: users.id, username: users.username, createdAt: users.createdAt })
    .from(users).where(eq(users.username, parsed.data.username))
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })

  const { user } = await getUserSession(event)
  const isMe = user?.id === profile.id
  const [shelter, [voted], galleries, manage] = await Promise.all([
    shelterOfUser(profile.id),
    db.select({ n: count() }).from(votes).where(eq(votes.voterId, `u:${profile.id}`)),
    loadGalleries(eq(pets.ownerId, profile.id), isMe),
    isMe ? shelterManage(profile.id) : null,
  ])
  return {
    username: profile.username,
    memberSince: profile.createdAt.toISOString(),
    isMe,
    shelter: shelter?.status === 'approved' ? (await toPublicShelters([shelter]))[0]! : null,
    votes: voted?.n ?? 0,
    pets: galleries,
    manage,
  }
})
