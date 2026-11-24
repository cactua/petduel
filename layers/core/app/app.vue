<script setup lang="ts">
import site from '#site'
import { siteBrand } from '#shared/site'

const { locale, t } = useI18n()
// Meno animazioni e contrasto alto scelti dal menu: attributi su <html>
useA11yHtmlAttrs()
// Le pagine danno solo il proprio titolo: il nome del sito si aggiunge qui
useHead({
  htmlAttrs: { lang: () => locale.value },
  titleTemplate: title => (title ? `${title} · ${site.name}` : site.name),
  // Colore della barra del browser su mobile, come lo sfondo del sito
  meta: [
    { name: 'theme-color', content: siteBrand(site).background },
    // Aperto dalla schermata Home dell'iPhone: a tutto schermo, con il nome del sito sotto l'icona
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: site.name },
  ],
  // Installabile come app (Android, computer, iPhone): scheda dell'app e icone generate dal server
  link: [
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icon/180.png' },
    { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon/192.png' },
  ],
})
// Anteprima dei link (WhatsApp, Telegram, social): la card del sito, finché una pagina non ne mette una sua
const origin = useRequestURL().origin
useSeoMeta({
  ogSiteName: site.name,
  ogType: 'website',
  ogDescription: () => `${t('duel.question')} · ${site.name}`,
  ogImage: `${origin}/card/site.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
