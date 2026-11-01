// Funzioni che arrivano da altri layer: ognuno le accende nel proprio app.config.ts.
// Il nucleo le usa per mostrare o nascondere link e voci di menu
export default defineAppConfig({
  features: {
    // Rifugi e adozioni (layers/shelters)
    shelters: false,
  },
})
