import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test delle funzioni pure (classifiche, abbinamenti, pubblicità): niente server né database.
// Si lanciano con: npm test
export default defineConfig({
  resolve: {
    alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
