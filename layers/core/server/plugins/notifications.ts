// Ogni tanto prepara gli avvisi di tutti (risultati delle sfide, cuori della settimana, classifica):
// prima si calcolavano solo aprendo la campanella. Un timer basta finché il sito gira su un solo server
const EVERY_MS = 15 * 60_000
// Il primo giro un po' dopo l'avvio, per non rallentare la partenza
const FIRST_MS = 30_000

export default defineNitroPlugin((nitro) => {
  if (import.meta.prerender || process.env.VITEST) return
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await refreshAllNotifications()
    }
    catch (e) {
      console.error('[avvisi] giro programmato non riuscito', e)
    }
    finally {
      running = false
    }
  }
  const first = setTimeout(run, FIRST_MS)
  const timer = setInterval(run, EVERY_MS)
  first.unref?.()
  timer.unref?.()
  nitro.hooks.hook('close', () => {
    clearTimeout(first)
    clearInterval(timer)
  })
})
