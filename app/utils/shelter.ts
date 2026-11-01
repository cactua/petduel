import type { ShelterAccent } from '#shared/models'

// Colore scelto dal rifugio: tinta piena per bottoni e fasce, con il testo che ci sta sopra.
// Tutte tinte medie, leggibili sia sul tema chiaro che su quello scuro.
const ACCENTS: Record<ShelterAccent, { color: string, ink: string }> = {
  coral: { color: '#d9503f', ink: '#fff' },
  sky: { color: '#2f74d0', ink: '#fff' },
  mint: { color: '#1a8a6a', ink: '#fff' },
  sun: { color: '#f2b51d', ink: '#3a2410' },
  lilac: { color: '#7a5ae0', ink: '#fff' },
  forest: { color: '#3d7a35', ink: '#fff' },
}

/** Variabili CSS --accent e --accent-ink di un rifugio */
export const accentStyle = (accent: ShelterAccent) => ({ '--accent': ACCENTS[accent].color, '--accent-ink': ACCENTS[accent].ink })

/** "IT60X0542811101000000123456" -> "IT60 X054 2811 1010 0000 0123 456" */
export const formatIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim()

/** Indicazioni stradali: OpenStreetMap e Google Maps (sui telefoni apre l'app) */
export const directionsLinks = (lat: number, lng: number) => ({
  osm: `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}#map=16/${lat}/${lng}`,
  google: `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}`,
})
