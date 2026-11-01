import { desc, eq } from 'drizzle-orm'
import { adoptionRequests, pets, users } from '@core/server/db/schema'
import type { MyShelter } from '#shared/models'

// Area del rifugio: stato della verifica, dati privati e richieste di adozione ricevute
export default defineEventHandler(async (event): Promise<MyShelter> => {
  const user = await requireUser(event)
  const shelter = await shelterOfUser(user.id)
  if (!shelter) return { shelter: null, requests: [] }

  const db = await useDb()
  const [[pub], requests] = await Promise.all([
    toPublicShelters([shelter]),
    shelter.status === 'approved'
      ? db.select({ r: adoptionRequests, petName: pets.name, requester: users.username, email: users.email })
          .from(adoptionRequests)
          .innerJoin(pets, eq(pets.id, adoptionRequests.petId))
          .innerJoin(users, eq(users.id, adoptionRequests.userId))
          .where(eq(adoptionRequests.shelterId, shelter.id))
          .orderBy(desc(adoptionRequests.createdAt))
          .limit(200)
      : [],
  ])
  return {
    shelter: {
      ...pub!,
      ...shelterProfile(shelter),
      status: shelter.status,
      rejectReason: shelter.rejectReason,
      taxCode: shelter.taxCode,
    },
    requests: requests.map(({ r, petName, requester, email }) => ({
      id: r.id,
      pet: { id: r.petId, name: petName },
      requester,
      email,
      phone: r.phone,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  }
})
