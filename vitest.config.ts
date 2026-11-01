import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test delle funzioni pure (classifiche, abbinamenti, pubblicità): niente server né database.
// Si lanciano con: npm test
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./layers/core/shared', import.meta.url)),
      // I test usano le categorie del sito degli animali
      '#site': fileURLToPath(new URL('./sites/pets/site.config.ts', import.meta.url)),
      '#site-it': fileURLToPath(new URL('./sites/pets/i18n/locales/it.json', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
