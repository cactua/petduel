// Finti composable di Nuxt per Storybook: hanno la stessa forma di quelli veri, ma leggono i dati dalla storia
// (sessione, risposte delle API) invece che dal server. Li importa da solo unimport (vedi .storybook/main.ts)
import { computed, defineComponent, reactive, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter, useRoute as vueUseRoute, useRouter as vueUseRouter } from 'vue-router'
import { LANGUAGES } from '../../layers/core/i18n/languages'
import { $fetch, resolveApi } from './fetch'
import { SITES_WITH_SHELTERS, currentSiteId } from './site'

// ── Router: una sola rotta che accetta tutto, così i link interni funzionano senza pagine ──
export const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
})
export const useRoute = vueUseRoute
export const useRouter = vueUseRouter
export const navigateTo = (to: string) => router.push(to)

// ── Lingue: vue-i18n come lo configura @nuxtjs/i18n (Composition API, nessun prefisso negli indirizzi) ──
export const i18n = createI18n({
  legacy: false,
  locale: 'it',
  fallbackLocale: 'it',
  messages: {},
  missingWarn: false,
  fallbackWarn: false,
})
type Composer = typeof i18n.global
const localeProperties = computed(() => LANGUAGES.find(l => l.code === i18n.global.locale.value) ?? LANGUAGES[0]!)
const nuxtI18n = Object.assign(i18n.global as Composer, {
  locales: computed(() => LANGUAGES),
  localeProperties,
  setLocale: async (code: string) => { i18n.global.locale.value = code as never },
})
export const useI18n = () => nuxtI18n
export const useNuxtApp = () => ({ $i18n: nuxtI18n, isHydrating: false, payload: { data: {} }, hook: () => {}, callHook: async () => {} })

// ── Sessione (nuxt-auth-utils): l'utente lo decide la storia con parameters.user ──
export interface StoryUser { id: number, username: string, role: 'user' | 'admin', needsRules?: boolean }
const session = reactive<{ user: StoryUser | null }>({ user: null })
export function setStoryUser(user: StoryUser | null | undefined) { session.user = user ?? null }
export function useUserSession() {
  return {
    loggedIn: computed(() => session.user !== null),
    user: computed(() => session.user),
    session: computed(() => ({ user: session.user })),
    ready: computed(() => true),
    fetch: async () => {},
    clear: async () => { session.user = null },
    openInPopup: () => {},
  }
}

// ── Configurazione ──
export const useRuntimeConfig = () => ({
  public: {
    map: {
      tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
    legal: { owner: 'Mario Rossi (esempio)', email: 'privacy@example.com' },
    adsEmail: 'ads@example.com',
    // Una chiave finta: senza, le notifiche push non compaiono (come in un sito senza VAPID nel .env)
    vapidPublicKey: 'BStorybookFakeVapidKey',
  },
})
export const useAppConfig = () => ({ features: { shelters: SITES_WITH_SHELTERS.includes(currentSiteId()) } })
export const defineAppConfig = <T>(c: T) => c
export const defineNuxtComponent = defineComponent

// ── Stato condiviso, cookie, head: in memoria, si azzerano a ogni storia ──
const states = new Map<string, Ref>()
export function resetNuxtState() { states.clear() }
export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!states.has(key)) states.set(key, ref(init ? init() : undefined))
  return states.get(key) as Ref<T>
}
export function useCookie<T>(name: string, opts: { default?: () => T } = {}): Ref<T> {
  return useState<T>(`cookie:${name}`, () => (opts.default ? opts.default() : (null as T)))
}
export const useHead = (_input?: unknown) => {}
export const useSeoMeta = (_input?: unknown) => {}
export const useRequestURL = () => new URL(location.href)
export const clearNuxtData = () => {}
export const refreshNuxtData = async () => {}

// ── useFetch / useLazyFetch: stessi campi di quelli veri, dati da parameters.api ──
interface FetchOptions<T> {
  method?: string
  query?: MaybeRefOrGetter<Record<string, unknown> | undefined>
  body?: unknown
  default?: () => T
  immediate?: boolean
  watch?: unknown[] | false
  transform?: (v: T) => T
  key?: string
  lazy?: boolean
  server?: boolean
}
export function useFetch<T>(url: MaybeRefOrGetter<string>, opts: FetchOptions<T> = {}) {
  const data = shallowRef<T | undefined>(opts.default?.()) as Ref<T>
  const error = shallowRef<unknown>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const pending = computed(() => status.value === 'pending')
  async function execute() {
    status.value = 'pending'
    try {
      const value = await resolveApi<T>(toValue(url), { method: opts.method, query: toValue(opts.query), body: opts.body })
      data.value = (opts.transform ? opts.transform(value) : value) ?? (opts.default?.() as T)
      error.value = null
      status.value = 'success'
    }
    catch (e) {
      error.value = e
      status.value = 'error'
    }
  }
  if (opts.watch !== false) watch([() => toValue(url), () => toValue(opts.query), ...(opts.watch || [])], () => execute())
  const first = opts.immediate === false ? Promise.resolve() : execute()
  const result = { data, error, status, pending, refresh: execute, execute, clear: () => { data.value = opts.default?.() as T } }
  return Object.assign(first.then(() => result), result)
}
export const useLazyFetch = <T>(url: MaybeRefOrGetter<string>, opts: FetchOptions<T> = {}) => useFetch<T>(url, { ...opts, lazy: true })

export { $fetch }
