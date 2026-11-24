import site from '#site'
import { siteBrand } from '#shared/site'

// Scheda dell'app per "Aggiungi alla schermata Home" / "Installa": nome, colori e icone del sito
export default defineEventHandler((event) => {
  const brand = siteBrand(site)
  setResponseHeaders(event, { 'content-type': 'application/manifest+json', 'cache-control': 'public, max-age=3600' })
  return {
    id: '/',
    name: site.name,
    short_name: site.name,
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: brand.background,
    theme_color: brand.background,
    icons: [
      { src: '/icon/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
})
