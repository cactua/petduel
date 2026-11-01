// Sito furry. Tutto arriva dal nucleo in layers/core: qui va solo ciò che cambia.
import { LANGUAGES } from "../../layers/core/i18n/languages";

export default defineNuxtConfig({
  extends: ["../../layers/core"],
  // Testi di questo sito: nei file in i18n/locales basta mettere le voci che cambiano rispetto al nucleo
  i18n: { locales: LANGUAGES },
  // Palette viola; la mascotte (app/components/SiteMascot.vue) prende il posto di quella del nucleo
  css: ["~/assets/theme.scss"],
});
