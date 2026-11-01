// Scorciatoia del menu account: il proprio rifugio (se c'è) e le richieste nuove
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return shelterManage(user.id)
})
