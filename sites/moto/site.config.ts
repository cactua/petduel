import { defineSite } from '../../layers/core/shared/site'

// BikeDuel: foto di moto. Duelli e classifiche restano dentro lo stesso tipo di moto.
// Razza e città diventano "Marca e modello" e città (i nomi dei campi nel database restano breed e city)
export default defineSite({
  id: 'moto',
  // Nome provvisorio
  name: 'BikeDuel',
  categories: [
    { id: 'sportiva', slug: 'sport', emoji: '🏁' },
    { id: 'naked', slug: 'naked', emoji: '🏍️' },
    { id: 'touring', slug: 'touring', emoji: '🧭' },
    { id: 'custom', slug: 'custom', emoji: '🛠️' },
    { id: 'enduro', slug: 'off-road', emoji: '⛰️' },
    { id: 'scooter', slug: 'scooters', emoji: '🛵' },
    { id: 'epoca', slug: 'vintage', emoji: '🕰️' },
    { id: 'altra', slug: 'others', emoji: '✨' },
  ],
  challengeThemes: [
    { slug: 'golden-hour', title: 'Al tramonto', emoji: '🌅', description: 'La moto nella luce calda della sera.' },
    { slug: 'mountain-pass', title: 'In cima al passo', emoji: '🏔️', description: 'Tornanti, curve e panorami: la moto in montagna.' },
    { slug: 'track-day', title: 'In pista', emoji: '🏁', description: 'Cordoli, piega e cronometro: la sportiva nel suo habitat.', species: 'sportiva' },
    { slug: 'garage', title: 'In officina', emoji: '🔧', description: 'In garage, sul cavalletto o con gli attrezzi intorno.' },
    { slug: 'mud', title: 'Sporca di fango', emoji: '🟫', description: 'Dopo una giornata fuoristrada, senza lavarla.', species: 'enduro' },
    { slug: 'sea-view', title: 'Vista mare', emoji: '🌊', description: 'Lungomare, spiagge e strade costiere.' },
    { slug: 'night-lights', title: 'Luci della notte', emoji: '🌃', description: 'Fari accesi, insegne e riflessi sull\'asfalto.' },
    { slug: 'shiny', title: 'Lucida come nuova', emoji: '✨', description: 'Appena lavata e lucidata: cromature che brillano.' },
    { slug: 'road-trip', title: 'Pronta per il viaggio', emoji: '🧳', description: 'Borse, bauletto e chilometri davanti.' },
    { slug: 'classic', title: 'Fascino d\'epoca', emoji: '🕰️', description: 'Restaurata o originale, con tutti i suoi anni.', species: 'epoca' },
    { slug: 'details', title: 'Il dettaglio giusto', emoji: '🔍', description: 'Un primo piano: serbatoio, strumentazione, scarico o il particolare che la rende unica.' },
    { slug: 'city-ride', title: 'Giro in città', emoji: '🏙️', description: 'Tra vicoli, piazze e semafori. Occhio a coprire le targhe.' },
  ],
  // Al posto di razza e città: marca e modello, città (anche per la classifica per città)
  breedAndCity: true,
  // La pagina di una moto è /bike/<id>, non /pet/<id>
  entryPath: 'bike',
  // Una moto vista di lato in una card verticale si vede solo a metà
  wideMedia: true,
  // Come app/assets/theme.scss. Niente mascotte (mascotSvg), come in app/components/SiteMascot.vue
  brand: {
    accent: '#f26b1d',
    glow: 'rgba(242,107,29,.45)',
    background: '#f7f4f0',
    ink: '#24262b',
    muted: '#6b6f78',
    blobs: ['#ffe1cc', '#dfe4ea', '#fff0c2'],
    // Come SiteIcon.vue: la moto vista di lato al posto della zampa
    appIcon: '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="15.5" r="3.5"/><circle cx="18.5" cy="15.5" r="3.5"/><path d="M5.5 15.5 9 10h5.5l4 5.5M9 10 7.5 7H5.5M14.5 10l2-3.5h2.5M10 13.5h4"/></g>',
  },
})
