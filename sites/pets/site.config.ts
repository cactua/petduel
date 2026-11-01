import { defineSite } from '../../layers/core/shared/site'

// PetDuel: animali domestici. I pet di esempio sono in server/assets/seed
export default defineSite({
  id: 'pets',
  categories: [
    { id: 'cane', slug: 'cani', emoji: '🐶' },
    { id: 'gatto', slug: 'gatti', emoji: '🐱' },
    { id: 'coniglio', slug: 'conigli', emoji: '🐰' },
    { id: 'roditore', slug: 'roditori', emoji: '🐹' },
    { id: 'uccello', slug: 'uccelli', emoji: '🦜' },
    { id: 'rettile', slug: 'rettili', emoji: '🦎' },
    { id: 'altro', slug: 'altri', emoji: '🐾' },
  ],
  challengeThemes: [
    { slug: 'dormiglione', title: 'Il più dormiglione', emoji: '😴', description: 'La foto del pisolino più tenero: nel letto, sul divano o nei posti più improbabili.' },
    { slug: 'linguaccia', title: 'Linguaccia!', emoji: '😛', description: 'Lingua di fuori, senza vergogna.' },
    { slug: 'agguato', title: 'Agguato felino', emoji: '🐾', description: 'Il gatto pronto a balzare: sguardo fisso e coda che vibra.', species: 'gatto' },
    { slug: 'scatola', title: 'Re della scatola', emoji: '📦', description: 'Dentro una scatola, un cesto, un vaso o qualsiasi posto troppo piccolo.' },
    { slug: 'faccia-colpevole', title: 'Faccia da colpevole', emoji: '🙈', description: 'Il momento subito dopo il disastro.' },
    { slug: 'riporto', title: 'Il re del riporto', emoji: '🎾', description: 'Pallina, bastone o ciabatta: il cane in azione.', species: 'cane' },
    { slug: 'sguardo', title: 'Sguardo che conquista', emoji: '👀', description: 'Gli occhi più dolci (o più intensi) del web.' },
    { slug: 'migliori-amici', title: 'Migliori amici', emoji: '🧸', description: 'Con il gioco, il peluche o l\'amico animale preferito.' },
    { slug: 'esploratore', title: 'Piccolo esploratore', emoji: '🌿', description: 'Avventure all\'aria aperta: prati, spiagge, montagne o il balcone di casa.' },
    { slug: 'musetto-goloso', title: 'Musetto goloso', emoji: '🥕', description: 'Il pet sorpreso a mangiare: carote, semi, crocchette o il tuo panino.' },
    { slug: 'pose-impossibili', title: 'Pose impossibili', emoji: '🤸', description: 'Contorsionisti nati: le posizioni più assurde.' },
    { slug: 'bagnetto', title: 'Dopo il bagnetto', emoji: '🛁', description: 'Pelo bagnato, dignità perduta.' },
  ],
})
