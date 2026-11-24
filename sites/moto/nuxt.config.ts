// Sito moto (BikeDuel). Tutto arriva dal nucleo in layers/core: qui va solo ciò che cambia.
// Dati, foto caricate e .env sono in questa cartella, separati da quelli degli altri siti
import { LANGUAGES } from "../../layers/core/i18n/languages";

export default defineNuxtConfig({
  extends: ["../../layers/core"],
  // Testi di questo sito: nei file in i18n/locales basta mettere le voci che cambiano rispetto al nucleo
  i18n: { locales: LANGUAGES },
  // Palette arancio e antracite; SiteIcon (una moto) e SiteMascot (nessuna) in app/components/atoms prendono il posto di quelli del nucleo
  css: ["~/assets/theme.scss"],
  // Componenti che sostituiscono quelli del nucleo, divisi in atoms/molecules/organisms come nel nucleo:
  // nomi senza prefisso della cartella, così atoms/SiteMascot.vue resta SiteMascot e prende il posto di quello del nucleo
  components: [{ path: "~/components", pathPrefix: false }],
});
