// Carica lo script di Google AdSense una sola volta per pagina (anche se più card lo chiedono)
let loading: Promise<void> | undefined

export function loadAdsense(client: string) {
  loading ||= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.crossOrigin = 'anonymous'
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    s.onload = () => resolve()
    s.onerror = () => { loading = undefined; s.remove(); reject(new Error('adsense')) }
    document.head.appendChild(s)
  })
  return loading
}
