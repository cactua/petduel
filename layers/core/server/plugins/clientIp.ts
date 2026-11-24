// Fissa l'IP della richiesta prima di ogni altro controllo. getRequestIP di h3 restituisce questo valore
// (event.context.clientAddress) anche con xForwardedFor: così il rate limiter di nuxt-security e i nostri
// limiti per rete (networkOf) non si fanno ingannare da un X-Forwarded-For inventato
export default defineNitroPlugin((nitroApp) => {
  const { clientIpHeader, trustedProxyHops } = useRuntimeConfig()
  nitroApp.hooks.hook('request', (event) => {
    event.context.clientAddress = resolveClientIp(event, { header: clientIpHeader, hops: Number(trustedProxyHops) })
  })
})
