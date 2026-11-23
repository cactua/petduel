import { profileImageSources } from '#shared/images'

export const MY_AVATAR_KEY = 'my-avatar'

/** Il proprio avatar (sorgenti per <picture>) o null: lo usano il menu dell'account e la barra in basso */
export function useMyAvatar() {
  const { loggedIn } = useUserSession()
  const { data } = useFetch<{ id: string | null }>('/api/me/avatar', {
    key: MY_AVATAR_KEY,
    immediate: loggedIn.value,
    watch: [loggedIn],
    default: () => ({ id: null }),
  })
  return computed(() => (loggedIn.value && data.value?.id ? profileImageSources(data.value.id, 'avatar', '44px') : null))
}
