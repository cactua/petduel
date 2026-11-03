// Comodità per l'interfaccia: la vera protezione è sulle API (requireAdmin)
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  if (user.value?.role !== 'admin') return navigateTo('/')
})
