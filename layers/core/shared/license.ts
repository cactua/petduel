/**
 * Link al testo della licenza Creative Commons citata nel credito di un'immagine
 * ("Autore · CC BY-SA 4.0 · Wikimedia Commons"). Le licenze CC chiedono di citare autore, fonte,
 * licenza con il suo link e di dire se l'immagine è stata modificata (qui: ritagliata e ridimensionata).
 * null se nel credito non c'è una licenza CC riconoscibile (es. pubblico dominio o artista indicato da chi carica)
 */
export function licenseUrl(credit: string | null | undefined): string | null {
  if (!credit) return null
  if (/\bCC0\b/i.test(credit)) return 'https://creativecommons.org/publicdomain/zero/1.0/'
  const m = credit.match(/\bCC (BY(?:-NC)?(?:-SA|-ND)?) (\d\.\d)(?: ([a-z]{2}))?\b/i)
  if (!m) return null
  const [, kind, version, port] = m
  return `https://creativecommons.org/licenses/${kind!.toLowerCase()}/${version}/${port ? `${port.toLowerCase()}/` : ''}`
}

/** Le immagini di Wikimedia Commons del sito sono ritagliate e ridimensionate: va detto accanto al credito */
export const isCommonsCredit = (credit: string | null | undefined) => !!credit?.includes('Wikimedia Commons')
