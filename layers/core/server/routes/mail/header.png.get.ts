import { Resvg } from '@resvg/resvg-js'
import site from '#site'
import { PAW_APP_ICON, siteBrand } from '#shared/site'

// Immagine in testa alle email (600×160, disegnata al doppio per gli schermi densi): i colori del sito,
// la mascotte se c'è (Biscotto su PetDuel), altrimenti l'icona dell'app. Decorativa: nelle email ha alt vuoto
let png: Buffer | undefined

function mailHeaderSvg() {
  const brand = siteBrand(site)
  const [b1, b2, b3] = brand.blobs
  const figure = brand.mascotSvg
    ? brand.mascotSvg.replace('<svg ', '<svg x="404" y="22" width="140" height="127" ')
    : `<g transform="translate(414 30)"><rect width="100" height="100" rx="24" fill="${brand.accent}"/>`
      + `<g transform="translate(19 19) scale(2.6)">${brand.appIcon ?? PAW_APP_ICON}</g></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160">
<rect width="600" height="160" fill="${brand.background}"/>
<circle cx="70" cy="150" r="110" fill="${b1}"/>
<circle cx="300" cy="-30" r="95" fill="${b2}"/>
<circle cx="560" cy="170" r="120" fill="${b3}"/>
<circle cx="200" cy="96" r="7" fill="${brand.accent}" opacity=".55"/>
<circle cx="240" cy="62" r="4" fill="${brand.accent}" opacity=".45"/>
<circle cx="352" cy="118" r="5" fill="${brand.accent}" opacity=".5"/>
<path d="M150 46l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="${brand.accent}" opacity=".6"/>
<path d="M372 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${brand.accent}" opacity=".5"/>
${figure}
</svg>`
}

export default defineEventHandler((event) => {
  png ??= new Resvg(mailHeaderSvg(), { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  setResponseHeaders(event, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
  return png
})
