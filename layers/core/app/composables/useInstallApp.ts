// "Installa l'app": Chrome ed Edge (Android e computer) offrono l'installazione con un evento che teniamo da parte
// finché non si tocca il pulsante. Safari non lo manda: su iPhone si usa Condividi → Aggiungi alla schermata Home
interface InstallEvent extends Event { prompt: () => Promise<void>, userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const deferred = shallowRef<InstallEvent | null>(null)

export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred.value = e as InstallEvent
  })
  window.addEventListener('appinstalled', () => (deferred.value = null))
}

export function useInstallApp() {
  const canInstall = computed(() => !!deferred.value)
  async function install() {
    const e = deferred.value
    if (!e) return
    deferred.value = null
    await e.prompt()
    await e.userChoice.catch(() => null)
  }
  return { canInstall, install }
}
