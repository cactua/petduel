import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { blocks, pets, photos, users, votes } from '../../db/schema'
import { HAS_ARTISTS, usernameSchema, type Profile } from '#shared/models'

const paramsSchema = z.object({ username: usernameSchema })

// Profilo pubblico: solo username e pet, mai l'email
export default defineEventHandler(async (event): Promise<Profile> => {
  const parsed = paramsSchema.safeParse(getRouterParams(event))
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })

  const db = await useDb()
  const [profile] = await db.select({ id: users.id, username: users.username, createdAt: users.createdAt, isArtist: users.isArtist, artistLinks: users.artistLinks })
    .from(users).where(eq(users.username, parsed.data.username))
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'errors.userNotFound' })

  const { user } = await getUserSession(event)
  const isMe = user?.id === profile.id
  const [shelter, [voted], galleries, manage, artworks, [blocked]] = await Promise.all([
    shelterOfUser(profile.id),
    db.select({ n: count() }).from(votes).where(eq(votes.voterId, `u:${profile.id}`)),
    loadGalleries(eq(pets.ownerId, profile.id), isMe),
    isMe ? shelterManage(profile.id) : null,
    HAS_ARTISTS
      ? db.select({ photoId: photos.id, petId: pets.id, name: pets.name, image: photos.image }).from(photos)
          .innerJoin(pets, eq(pets.id, photos.petId))
          .where(and(eq(photos.artistId, profile.id), eq(photos.status, 'approved')))
          .orderBy(desc(photos.createdAt)).limit(60)
      : [],
    user && !isMe
      ? db.select({ id: blocks.blockedId }).from(blocks).where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, profile.id)))
      : [],
  ])
  return {
    username: profile.username,
    memberSince: profile.createdAt.toISOString(),
    isMe,
    shelter: shelter?.status === 'approved' ? (await toPublicShelters([shelter]))[0]! : null,
    votes: voted?.n ?? 0,
    pets: galleries,
    manage,
    artist: HAS_ARTISTS && profile.isArtist ? { links: profile.artistLinks } : null,
    artworks: artworks.map(a => ({ ...a, image: imageUrl(a.image) })),
    blocked: !!blocked,
  }
})
