import type { Ref } from 'vue'

/**
 * Chiede conferma prima di lasciare una pagina con modifiche non salvate: cambiando pagina nel sito
 * (cambiare solo l'ancora non conta) e chiudendo o ricaricando la scheda
 */
export function useLeaveGuard(dirty: Ref<boolean>, message = 'Ci sono modifiche non salvate. Uscire lo stesso?') {
  const router = useRouter()
  const off = router.beforeEach((to, from) => to.path === from.path || !dirty.value || window.confirm(message))
  function onUnload(e: BeforeUnloadEvent) {
    if (!dirty.value) return
    e.preventDefault()
    e.returnValue = ''
  }
  onMounted(() => window.addEventListener('beforeunload', onUnload))
  onBeforeUnmount(() => {
    off()
    window.removeEventListener('beforeunload', onUnload)
  })
}
