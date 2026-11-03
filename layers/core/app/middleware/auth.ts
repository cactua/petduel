// Comodità per l'interfaccia: la vera protezione è sulle API (requireUser)
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})
