/**
 * Foto incollata (Ctrl+V / Cmd+V, o "Incolla" su telefono) o trascinata sulla pagina:
 * chiama `onPhoto` con il primo file immagine. Il testo incollato nei campi resta com'è.
 * `enabled`: per ascoltare solo quando la pagina mostra il campo foto.
 */
export function usePhotoPaste(onPhoto: (file: File) => void, enabled: MaybeRefOrGetter<boolean> = true) {
  const dragging = ref(false)

  const firstImage = (list?: DataTransferItemList | FileList | null) => {
    for (const item of Array.from<DataTransferItem | File>(list ?? [])) {
      const file = item instanceof File ? item : item.kind === 'file' ? item.getAsFile() : null
      if (file?.type.startsWith('image/')) return file
    }
    return null
  }
  // Gli appunti danno un nome generico ("image.png"): meglio uno riconoscibile
  const named = (file: File) => file.name && file.name !== 'image.png'
    ? file
    : new File([file], `foto-incollata.${file.type.split('/')[1] ?? 'png'}`, { type: file.type })

  function onPaste(e: ClipboardEvent) {
    if (!toValue(enabled)) return
    const file = firstImage(e.clipboardData?.items)
    if (!file) return
    e.preventDefault()
    onPhoto(named(file))
  }
  function onDragOver(e: DragEvent) {
    if (!toValue(enabled) || !e.dataTransfer?.types.includes('Files')) return
    e.preventDefault()
    dragging.value = true
  }
  function onDrop(e: DragEvent) {
    dragging.value = false
    if (!toValue(enabled)) return
    const file = firstImage(e.dataTransfer?.files)
    if (!file) return
    e.preventDefault()
    onPhoto(file)
  }
  const onDragLeave = (e: DragEvent) => {
    if (!e.relatedTarget) dragging.value = false
  }

  // Pulsante "Incolla": serve soprattutto su telefono, dove non c'è Ctrl+V
  const canRead = ref(false)
  const { t } = useI18n()
  async function readClipboard() {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find(t => t.startsWith('image/'))
        if (!type) continue
        const blob = await item.getType(type)
        onPhoto(named(new File([blob], 'image.png', { type })))
        return ''
      }
      return t('upload.noClipboardPhoto')
    }
    catch {
      return t('upload.clipboardDenied')
    }
  }

  onMounted(() => {
    canRead.value = typeof navigator.clipboard?.read === 'function'
    document.addEventListener('paste', onPaste)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    document.addEventListener('dragleave', onDragLeave)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('paste', onPaste)
    document.removeEventListener('dragover', onDragOver)
    document.removeEventListener('drop', onDrop)
    document.removeEventListener('dragleave', onDragLeave)
  })
  return { dragging, canRead, readClipboard }
}
