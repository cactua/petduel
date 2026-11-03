// Rifugi e adozioni: pagine /shelters e /my-shelter, richieste di adozione, verifica dei rifugi nell'admin.
// Un sito lo include mettendolo in "extends" prima del nucleo. Tabelle e letture dei dati restano nel nucleo:
// sui siti senza questo layer sono semplicemente vuote
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "../core/i18n/languages";

export default defineNuxtConfig({
  // Come nel nucleo: nomi dei componenti senza prefisso della cartella
  components: [{ path: fileURLToPath(new URL("./app/components", import.meta.url)), pathPrefix: false }],
  i18n: { locales: LANGUAGES },
});
