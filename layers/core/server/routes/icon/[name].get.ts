import { Resvg } from '@resvg/resvg-js'
import site from '#site'
import { PAW_APP_ICON, siteBrand } from '#shared/site'

// Icona dell'app installata e delle notifiche: /icon/192.png, /icon/512.png, /icon/maskable-512.png
// (la "maskable" lascia margine: Android la ritaglia a cerchio o a goccia), /icon/badge-96.png (solo forma, per Android)
const cache = new Map<string, Buffer>()

export default defineEventHandler((event) => {
  const match = /^(maskable-|badge-)?(96|180|192|512)\.png$/.exec(getRouterParam(event, 'name') ?? '')
  if (!match) throw createError({ statusCode: 404 })
  const [, kind, sizeText] = match
  const size = Number(sizeText)
  const key = `${kind ?? ''}${size}`

  let png = cache.get(key)
  if (!png) {
    const brand = siteBrand(site)
    const symbol = brand.appIcon ?? PAW_APP_ICON
    // Simbolo più piccolo nella maskable (zona sicura dell'80%); il badge è solo il simbolo bianco su trasparente
    const scale = kind === 'maskable-' ? 0.5 : kind === 'badge-' ? 0.9 : 0.62
    const offset = (24 - 24 * scale) / 2
    const bg = kind === 'badge-' ? '' : kind === 'maskable-' ? `<rect width="24" height="24" fill="${brand.accent}"/>` : `<rect width="24" height="24" rx="5.4" fill="${brand.accent}"/>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${bg}<g transform="translate(${offset} ${offset}) scale(${scale})">${symbol}</g></svg>`
    png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
    cache.set(key, png)
  }
  setResponseHeaders(event, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
  return png
})
