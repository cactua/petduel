import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { TOP_RANK, type ChallengeDetail } from '#shared/models'
import { challengeEntries, photos, pets } from '../../../db/schema'

const paramsSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/) })

export default defineEventHandler(async (event): Promise<ChallengeDetail> => {
  const parsed = paramsSchema.safeParse(getRouterParams(event))
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'errors.challengeNotFound' })

  const challenge = await getChallenge(parsed.data.slug)
  const [summary] = await toSummaries([challenge])
  const { user } = await getUserSession(event)

  // Le proprie partecipazioni si vedono anche se la foto è ancora in attesa
  let myEntries: ChallengeDetail['myEntries'] = []
  if (user) {
    const db = await useDb()
    const rows = await db.select({ entryId: challengeEntries.id, petId: pets.id, petName: pets.name, image: photos.image, status: photos.status })
      .from(challengeEntries)
      .innerJoin(pets, eq(pets.id, challengeEntries.petId))
      .innerJoin(photos, eq(photos.id, challengeEntries.photoId))
      .where(and(eq(challengeEntries.challengeId, challenge.id), eq(pets.ownerId, user.id)))
    myEntries = rows.map(r => ({ ...r, image: r.status === 'rejected' ? '' : imageUrl(r.image) }))
  }

  return { ...summary!, standings: (await loadStandings(challenge.id, TOP_RANK)).filter(s => s.score > 0), myEntries }
})
