// Formati accettati per le immagini caricate: JPEG, PNG, WebP e HEIC/AVIF (le foto dei telefoni).
// Si guardano i primi byte prima di passare il file a sharp, così SVG, TIFF, GIF, PDF e gli altri formati
// che sharp saprebbe aprire non arrivano mai ai loro decoder
export function isAllowedImage(data: Buffer) {
  if (data.length < 12) return false
  // JPEG
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return true
  // PNG
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return true
  // WebP: "RIFF" <dimensione> "WEBP"
  if (data.toString('latin1', 0, 4) === 'RIFF' && data.toString('latin1', 8, 12) === 'WEBP') return true
  // HEIC e AVIF: <dimensione> "ftyp" <marca>
  if (data.toString('latin1', 4, 8) === 'ftyp') {
    return ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1', 'avif', 'avis'].includes(data.toString('latin1', 8, 12))
  }
  return false
}

export function assertAllowedImage(data: Buffer) {
  if (!isAllowedImage(data)) throw createError({ statusCode: 400, statusMessage: 'errors.invalidImage' })
}
