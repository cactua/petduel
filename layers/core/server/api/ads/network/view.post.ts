import { adNetworkViews } from '../../../db/schema'

// Il riquadro di Google è stato mostrato (lo chiama la card quando lo script è partito)
export default defineEventHandler(async (event) => {
  const { voterId } = await getVoter(event)
  const db = await useDb()
  await db.insert(adNetworkViews).values({ voterId })
  return { ok: true }
})
