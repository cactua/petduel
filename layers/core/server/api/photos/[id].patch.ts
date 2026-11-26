import { eq } from 'drizzle-orm'
import { z } from 'zod'
import site from '#site'
import { entryUrl } from '#shared/models'
import { photos, pets } from '../../db/schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })
// Uno o l'altro (o entrambi): uso nei duelli, artista (stessi campi del caricamento)
const bodySchema = z.object({
  inDuels: z.boolean().optional(),
  credit: z.object({ credit: z.string(), creditUrl: z.string(), artist: z.string() }).partial().optional(),
}).refine(b => b.inDuels !== undefined || b.credit !== undefined)

// Il proprietario sceglie se usare una sua immagine nei duelli (le altre restano nel profilo)
// e corregge l'artista di un'immagine già caricata
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, b => bodySchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'validation.check' })
  if (body.data.credit && !site.askCredit) throw createError({ statusCode: 400, statusMessage: 'validation.check' })

  const db = await useDb()
  const [row] = await db.select({ ownerId: pets.ownerId, petId: pets.id, petName: pets.name, status: photos.status, artistId: photos.artistId })
    .from(photos).innerJoin(pets, eq(pets.id, photos.petId)).where(eq(photos.id, id))
  if (!row || row.ownerId !== user.id) throw createError({ statusCode: 404, statusMessage: 'errors.photoNotFound' })

  const credit = body.data.credit ? await resolveCredit(event, { credit: '', creditUrl: '', artist: '', ...body.data.credit }) : null
  await db.update(photos).set({
    ...(body.data.inDuels !== undefined ? { inDuels: body.data.inDuels } : {}),
    ...(credit ?? {}),
  }).where(eq(photos.id, id))

  // Un artista aggiunto dopo: se il disegno è già pubblico lo scopre subito, come all'approvazione
  if (credit?.artistId && credit.artistId !== row.artistId && credit.artistId !== row.ownerId && row.status === 'approved') {
    await notify(credit.artistId, `artist:${id}`, { emoji: '🎨', text: 'notif.artistTagged', params: { name: row.petName }, link: entryUrl(row.petId) })
  }
  return { inDuels: body.data.inDuels, credit: credit ? photoCredit(credit.credit, credit.creditUrl) : undefined }
})
