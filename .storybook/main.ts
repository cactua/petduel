// Storybook della libreria dei componenti (Atomic Design): atomi, molecole, organismi e template di tutti i siti.
// Non avvia Nuxt: i componenti sono gli stessi file .vue dell'app, e ciò che Nuxt importerebbe da solo
// (useFetch, useI18n, NuxtLink, #site…) arriva dai finti moduli in .storybook/nuxt (vedi README in quella cartella).
// Avvio: npm run storybook (porta 6006). Il sito si sceglie dalla barra in alto: PetDuel, FurDuel, BikeDuel
import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import Unimport from 'unimport/unplugin'
import vue from '@vitejs/plugin-vue'

// Barre in avanti anche su Windows: unimport scrive questi percorsi negli import
const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url)).replaceAll('\\', '/')

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/vue3-vite', options: {} },
  // Foto di esempio dei siti (le stesse del seed del database) e disegni finti per il sito furry
  staticDirs: [
    { from: '../sites/pets/server/assets/seed', to: '/seed/pets' },
    { from: '../sites/moto/server/assets/seed', to: '/seed/moto' },
    { from: './assets', to: '/sb' },
    // Card da condividere vere, generate dai siti in sviluppo (/card/<id>.png): PetDuel 1, BikeDuel 2001, FurDuel 3001
    { from: './assets/card', to: '/card' },
  ],
  core: { disableTelemetry: true },
  async viteFinal(base) {
    return mergeConfig(base, {
      resolve: {
        alias: {
          // Come nel nuxt.config del nucleo
          '#shared': root('layers/core/shared'),
          '@core': root('layers/core'),
          // Il site.config.ts del sito scelto nella barra: un oggetto che cambia quando si cambia sito
          '#site': root('.storybook/nuxt/site.ts'),
          '#site-it': root('.storybook/nuxt/site-it.ts'),
          '#app': root('.storybook/nuxt/app.ts'),
          '#imports': root('.storybook/nuxt/app.ts'),
        },
      },
      define: {
        'import.meta.client': 'true',
        'import.meta.server': 'false',
        'import.meta.dev': 'true',
      },
      css: {
        preprocessorOptions: {
          // Come nel nuxt.config del nucleo: token, breakpoint e mixin in ogni <style lang="scss">
          scss: { additionalData: '@use "@core/app/assets/scss/abstracts" as *;\n' },
        },
      },
      plugins: [
        vue(),
        // Le importazioni automatiche di Nuxt: Vue, i finti composable di Nuxt e quelli veri del nucleo
        Unimport.vite({
          presets: ['vue'],
          addons: { vueTemplate: true },
          dirs: [root('layers/core/app/utils'), root('layers/core/app/composables')],
          imports: [
            ...['useNuxtApp', 'useRuntimeConfig', 'useAppConfig', 'useFetch', 'useLazyFetch', 'useUserSession', 'useCookie',
              'useState', 'useHead', 'useSeoMeta', 'useRequestURL', 'navigateTo', 'useRoute', 'useRouter', 'useI18n',
              'defineNuxtComponent', 'defineAppConfig', 'clearNuxtData', 'refreshNuxtData'].map(name => ({ name, from: root('.storybook/nuxt/app.ts') })),
            { name: '$fetch', from: root('.storybook/nuxt/fetch.ts') },
          ],
        }),
      ],
      optimizeDeps: { include: ['zod', 'vue-i18n', 'vue-router', 'leaflet'] },
    })
  },
}

export default config
