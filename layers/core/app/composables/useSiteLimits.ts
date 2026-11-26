import type { PetGallery, SiteLimits } from '#shared/models'

/**
 * Limiti di caricamento decisi dall'admin (Impostazioni): quante voci per utente, quante immagini per voce,
 * caricamenti aperti o chiusi. Servono per avvisare prima di provare, il server li controlla comunque.
 * Admin e rifugi approvati non hanno limiti (exempt)
 */
export function useSiteLimits() {
  const { user } = useUserSession()
  const { data, refresh } = useFetch<SiteLimits | null>('/api/limits', { key: 'site-limits', default: () => null })

  // Limiti che valgono per chi guarda (null se nessuno)
  const maxPets = computed(() => (data.value && !data.value.exempt ? data.value.maxPetsPerUser : null))
  const maxPhotos = computed(() => (data.value && !data.value.exempt ? data.value.maxPhotosPerPet : null))
  const uploadsClosed = computed(() => !!data.value && !data.value.uploadsOpen && user.value?.role !== 'admin')
  const signupsClosed = computed(() => !!data.value && !data.value.signupsOpen)

  // Contano le immagini in attesa e approvate, non quelle rifiutate (come sul server)
  const photoCount = (pet: Pick<PetGallery, 'photos'>) => pet.photos.filter(p => p.status !== 'rejected').length
  const petsFull = (count: number) => maxPets.value !== null && count >= maxPets.value
  const photosFull = (pet: Pick<PetGallery, 'photos'>) => maxPhotos.value !== null && photoCount(pet) >= maxPhotos.value

  return { data, refresh, maxPets, maxPhotos, uploadsClosed, signupsClosed, photoCount, petsFull, photosFull }
}
