// Immagini troppo grandi per l'invio: si rimpiccioliscono nel browser invece di essere rifiutate.
// Il server accetta fino a 10 MB (server/utils/photos.ts); si resta un po' sotto per il resto del modulo.
// I ritagli sono in proporzione (centro e zoom da 0 a 1), quindi restano validi anche sull'immagine ridotta.
const MAX_BYTES = 9 * 1024 * 1024
// Lato lungo massimo: più di così non serve a nessuna delle varianti create dal server
const MAX_SIDE = 4096

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
}

async function decode(file: File) {
  try {
    return await createImageBitmap(file)
  }
  catch {
    // Formati che il browser non sa disegnare (HEIC su Chrome): si manda com'è
    return null
  }
}

/** Il file stesso se va già bene, altrimenti una copia WebP (o JPEG dove WebP non c'è) più piccola */
export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file
  const bitmap = await decode(file)
  if (!bitmap) return file

  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return file
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      // WebP tiene la trasparenza dei disegni; Safari vecchi ridanno PNG: allora JPEG su fondo bianco
      let blob = await encode(canvas, 'image/webp', 0.9)
      if (!blob || blob.type !== 'image/webp') {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        blob = await encode(canvas, 'image/jpeg', 0.9)
      }
      if (blob && blob.size <= MAX_BYTES) {
        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
        return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'immagine'}.${ext}`, { type: blob.type })
      }
      scale *= 0.8
    }
    return file
  }
  finally {
    bitmap.close()
  }
}
