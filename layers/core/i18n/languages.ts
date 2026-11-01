// Lingue di tutti i siti. Il nucleo e ogni sito le dichiarano con questa stessa lista: ognuno carica il proprio
// i18n/locales/<file> e i testi del sito si sommano a quelli del nucleo, voce per voce
export const LANGUAGES = [
  { code: "it", language: "it-IT", name: "Italiano", file: "it.json" },
  { code: "en", language: "en-US", name: "English", file: "en.json" },
  { code: "es", language: "es-ES", name: "Español", file: "es.json" },
  { code: "fr", language: "fr-FR", name: "Français", file: "fr.json" },
  { code: "de", language: "de-DE", name: "Deutsch", file: "de.json" },
];
