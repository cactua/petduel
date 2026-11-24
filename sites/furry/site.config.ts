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
  // Profilo con le schede delle sona: specie, pronomi, colori e regole per chi le disegna
  sona: true,
  // Come app/assets/theme.scss. Niente mascotte (mascotSvg), come in app/components/atoms/SiteMascot.vue
  brand: {
    accent: '#c2410c',
    glow: 'rgba(217,72,15,.4)',
    background: '#fbf7f0',
    ink: '#1f1a17',
    muted: '#6b5e52',
    blobs: ['#ffe3cc', '#d4f1e8', '#dbeafe'],
  },
})
