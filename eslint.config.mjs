// Regole di @nuxt/eslint (Vue, TypeScript, import). Si lancia con: npm run lint
import withNuxt from './sites/pets/.nuxt/eslint.config.mjs'

export default withNuxt({
  // @nuxt/eslint riconosce pagine e layout solo nella cartella del sito: anche quelli dei layer
  // prendono il nome dal percorso, quindi non serve un nome composto
  files: ['layers/*/app/pages/**/*.vue', 'layers/*/app/layouts/**/*.vue', 'layers/*/app/app.vue'],
  rules: { 'vue/multi-word-component-names': 'off' },
})
