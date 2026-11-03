import { defineSite } from '../../layers/core/shared/site'

// Furry: per ora solo disegni, più avanti anche foto di fursuit.
// Categorie e temi delle sfide ancora da decidere: senza categorie tutti i disegni competono insieme
export default defineSite({
  id: 'furry',
  // Nome provvisorio, da decidere
  name: 'FurDuel',
  categories: [],
  challengeThemes: [],
  // Chi carica un disegno può indicare l'artista
  askCredit: true,
  // Per i personaggi non servono razza e città
  breedAndCity: false,
  // La pagina di un personaggio è /character/<id>, non /pet/<id>
  entryPath: 'character',
  // Come app/assets/theme.scss. Niente mascotte (mascotSvg), come in app/components/SiteMascot.vue
  brand: {
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,.5)',
    background: '#f8f5ff',
    ink: '#2a2140',
    muted: '#6b5f86',
    blobs: ['#e7dcff', '#d2f4ee', '#ffe0ef'],
  },
})
