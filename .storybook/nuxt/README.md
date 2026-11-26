# Nuxt finto per Storybook

Storybook non avvia Nuxt: usa direttamente i file `.vue` dell'app con Vite. Quello che Nuxt aggiungerebbe da solo
arriva da questa cartella, con la stessa forma delle funzioni vere.

| File | Al posto di |
| --- | --- |
| `app.ts` | `useFetch`, `useLazyFetch`, `useUserSession`, `useI18n`, `useNuxtApp`, `useRuntimeConfig`, `useAppConfig`, `useCookie`, `useState`, `useHead`, `navigateTo`, `useRoute`… (importati da soli con unimport, vedi `../main.ts`) |
| `fetch.ts` | `$fetch`: risponde con `parameters.api` della storia e registra ogni chiamata nel pannello Actions |
| `site.ts` | `#site`: il `site.config.ts` del sito scelto nella barra |
| `site-it.ts` | `#site-it`: testi italiani del nucleo più quelli del sito |
| `messages.ts` | i file di lingua uniti come fa `@nuxtjs/i18n` (nucleo → layer shelters → sito) |
| `components.ts` | la registrazione automatica dei componenti, `NuxtLink` e `ClientOnly` |

## Il sito scelto

Molte costanti del codice condiviso si calcolano una volta sola dal sito (`SPECIES`, `ENTRY_PATH`, `HAS_SONA`… in
`layers/core/shared/models.ts`). Per questo il sito si legge dall'indirizzo dell'anteprima (`?globals=site:furry`)
prima che si carichi tutto il resto, e quando lo si cambia dalla barra l'anteprima si ricarica (`../preview.ts`).
Così ogni sito vede gli stessi valori che vedrebbe in produzione, compresi i componenti che sostituisce
(`sites/<sito>/app/components`) e, solo per PetDuel, quelli del layer `layers/shelters`.

## Parametri delle storie

```ts
parameters: {
  user: { id: 7, username: 'giulia', role: 'user' },   // chi ha fatto l'accesso (null = visitatore)
  api: {
    '/api/notifications': { items: [], unread: 0 },    // ogni metodo
    'POST /api/reports': {},                            // solo POST
    'PATCH /api/photos/*': {},                          // prefisso
    'GET /api/artists': ({ query }) => [...],           // risposta calcolata
    'POST /api/auth/login': { __error: 401, message: 'errors.badLogin' }, // errore come dal server
  },
  apiDelay: 300,                                        // attesa finta in ms
  route: '/pet/1',                                      // pagina corrente per useRoute
  state: { 'cookie:consent': 'ads' },                  // valori iniziali di useState / useCookie
}
```

Se un componente comincia a usare una funzione di Nuxt che qui manca, va aggiunta in `app.ts` e nell'elenco
degli import in `../main.ts`.
