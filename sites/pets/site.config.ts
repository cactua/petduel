import { defineSite } from '../../layers/core/shared/site'

// PetDuel: animali domestici. I pet di esempio sono in server/assets/seed
export default defineSite({
  id: 'pets',
  name: 'PetDuel',
  categories: [
    { id: 'cane', slug: 'dogs', emoji: '🐶' },
    { id: 'gatto', slug: 'cats', emoji: '🐱' },
    { id: 'coniglio', slug: 'rabbits', emoji: '🐰' },
    { id: 'roditore', slug: 'rodents', emoji: '🐹' },
    { id: 'uccello', slug: 'birds', emoji: '🦜' },
    { id: 'rettile', slug: 'reptiles', emoji: '🦎' },
    { id: 'altro', slug: 'others', emoji: '🐾' },
  ],
  challengeThemes: [
    { slug: 'sleepyhead', title: 'Il più dormiglione', emoji: '😴', description: 'La foto del pisolino più tenero: nel letto, sul divano o nei posti più improbabili.' },
    { slug: 'tongue-out', title: 'Linguaccia!', emoji: '😛', description: 'Lingua di fuori, senza vergogna.' },
    { slug: 'pounce', title: 'Agguato felino', emoji: '🐾', description: 'Il gatto pronto a balzare: sguardo fisso e coda che vibra.', species: 'gatto' },
    { slug: 'box-king', title: 'Re della scatola', emoji: '📦', description: 'Dentro una scatola, un cesto, un vaso o qualsiasi posto troppo piccolo.' },
    { slug: 'guilty-face', title: 'Faccia da colpevole', emoji: '🙈', description: 'Il momento subito dopo il disastro.' },
    { slug: 'fetch', title: 'Il re del riporto', emoji: '🎾', description: 'Pallina, bastone o ciabatta: il cane in azione.', species: 'cane' },
    { slug: 'the-look', title: 'Sguardo che conquista', emoji: '👀', description: 'Gli occhi più dolci (o più intensi) del web.' },
    { slug: 'best-friends', title: 'Migliori amici', emoji: '🧸', description: 'Con il gioco, il peluche o l\'amico animale preferito.' },
    { slug: 'explorer', title: 'Piccolo esploratore', emoji: '🌿', description: 'Avventure all\'aria aperta: prati, spiagge, montagne o il balcone di casa.' },
    { slug: 'foodie', title: 'Musetto goloso', emoji: '🥕', description: 'Il pet sorpreso a mangiare: carote, semi, crocchette o il tuo panino.' },
    { slug: 'impossible-poses', title: 'Pose impossibili', emoji: '🤸', description: 'Contorsionisti nati: le posizioni più assurde.' },
    { slug: 'bath-time', title: 'Dopo il bagnetto', emoji: '🛁', description: 'Pelo bagnato, dignità perduta.' },
  ],
})
