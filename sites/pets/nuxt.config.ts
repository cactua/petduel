// Sito PetDuel (animali domestici). Tutto arriva dal nucleo in layers/core: qui va solo ciò che cambia.
// Dati, foto caricate e .env sono in questa cartella, separati da quelli degli altri siti
import { LANGUAGES } from "../../layers/core/i18n/languages";

export default defineNuxtConfig({
  extends: ["../../layers/core"],
  // Testi di questo sito: nei file in i18n/locales basta mettere le voci che cambiano rispetto al nucleo
  i18n: { locales: LANGUAGES },
});
