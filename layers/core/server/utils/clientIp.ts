import { getRequestHeader, type H3Event } from 'h3'

/**
 * IP di chi fa la richiesta, preso solo da dove ci si può fidare.
 * Gli header X-Forwarded-For e simili li può scrivere chiunque: valgono solo se davanti al server c'è un
 * proxy che li riscrive, e lo si dice nel file .env:
 * - NUXT_CLIENT_IP_HEADER: header con l'IP che il proxy sovrascrive sempre (cf-connecting-ip con Cloudflare,
 *   x-real-ip con molti Nginx)
 * - NUXT_TRUSTED_PROXY_HOPS: quanti proxy di fiducia aggiungono il loro pezzo in fondo a X-Forwarded-For
 *   (1 con un solo Nginx o un solo bilanciatore). Si legge da destra: le voci a sinistra le può inventare il client
 * Senza nessuno dei due vale l'indirizzo della connessione.
 */
export function resolveClientIp(event: H3Event, opts: { header?: string, hops?: number }) {
  const socketIp = event.node.req.socket?.remoteAddress ?? 'unknown'
  const header = opts.header?.trim().toLowerCase()
  if (header) {
    const value = getRequestHeader(event, header)?.split(',')[0]?.trim()
    return value || socketIp
  }
  const hops = Math.max(0, Math.floor(Number(opts.hops) || 0))
  if (hops > 0) {
    const chain = (getRequestHeader(event, 'x-forwarded-for') ?? '').split(',').map(s => s.trim()).filter(Boolean)
    // L'ultimo proxy di fiducia ha aggiunto in fondo l'indirizzo da cui gli è arrivata la richiesta
    const ip = chain[chain.length - hops]
    if (ip) return ip
  }
  return socketIp
}
