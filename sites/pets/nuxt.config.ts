// Sito PetDuel (animali domestici). Tutto arriva dal nucleo (layers/core) e dai rifugi (layers/shelters): qui va solo ciò che cambia.
// Dati, foto caricate e .env sono in questa cartella, separati da quelli degli altri siti
import { LANGUAGES } from "../../layers/core/i18n/languages";

export default defineNuxtConfig({
  // Prima i layer delle funzioni in più, poi il nucleo: a parità di nome vince il primo
  extends: ["../../layers/shelters", "../../layers/core"],
  // Testi di questo sito: nei file in i18n/locales basta mettere le voci che cambiano rispetto al nucleo
  i18n: { locales: LANGUAGES },
});
