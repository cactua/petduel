// Registra i componenti come fa Nuxt (nome del file, senza la cartella atoms/molecules/organisms) e mette
// al posto giusto quelli che un sito o un layer sostituisce (SiteMascot, SiteIcon, AdoptionCard…).
// Nelle storie dei componenti sostituiti si usa il nome registrato (<SiteMascot />), non l'import del file.
// Ordine di precedenza, come negli extends dei nuxt.config: sito → layer shelters (solo pets) → nucleo
import { defineComponent, h, type App, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { SITES_WITH_SHELTERS, currentSiteId, type SiteId } from './site'

type Modules = Record<string, { default: Component }>
const nameOf = (path: string) => path.split('/').pop()!.replace(/\.vue$/, '')
const byName = (mods: Modules) => Object.fromEntries(Object.entries(mods).map(([p, m]) => [nameOf(p), m.default]))

const core = byName(import.meta.glob<{ default: Component }>('../../layers/core/app/components/**/*.vue', { eager: true }))
const shelters = byName(import.meta.glob<{ default: Component }>('../../layers/shelters/app/components/**/*.vue', { eager: true }))
const siteMods = import.meta.glob<{ default: Component }>('../../sites/*/app/components/**/*.vue', { eager: true })
const perSite: Record<string, Record<string, Component>> = {}
for (const [path, mod] of Object.entries(siteMods)) {
  const id = path.split('/sites/')[1]!.split('/')[0]!
  ;(perSite[id] ??= {})[nameOf(path)] = mod.default
}

/** Il componente che il sito usa davvero con quel nome */
export function resolveForSite(name: string, site: SiteId = currentSiteId()): Component | undefined {
  return perSite[site]?.[name] ?? (SITES_WITH_SHELTERS.includes(site) ? shelters[name] : undefined) ?? core[name]
}

/** NuxtLink: <RouterLink> per gli indirizzi interni, <a> per quelli esterni (come fa Nuxt) */
const NuxtLink = defineComponent({
  name: 'NuxtLink',
  inheritAttrs: false,
  props: { to: { type: [String, Object], default: undefined }, href: { type: String, default: undefined }, external: Boolean, target: String, rel: String, noRel: Boolean, prefetch: Boolean, noPrefetch: Boolean, activeClass: String, exactActiveClass: String, replace: Boolean, ariaCurrentValue: String },
  setup(props, { slots, attrs }) {
    return () => {
      const to = props.to ?? props.href ?? ''
      const external = props.external || (typeof to === 'string' && /^([a-z]+:|\/\/)/i.test(to))
      if (external) {
        const rel = props.noRel ? undefined : (props.rel ?? (props.target ? 'noopener noreferrer' : undefined))
        return h('a', { ...attrs, href: to as string, target: props.target, rel }, slots.default?.())
      }
      return h(RouterLink, { ...attrs, to, replace: props.replace, activeClass: props.activeClass, exactActiveClass: props.exactActiveClass, ariaCurrentValue: props.ariaCurrentValue as never }, slots)
    }
  },
})

const ClientOnly = defineComponent({ name: 'ClientOnly', setup: (_, { slots }) => () => slots.default?.() })
const Empty = defineComponent({ render: () => null })

export function registerNuxtComponents(app: App) {
  // Il sito non cambia finché l'anteprima non si ricarica (vedi site.ts): basta scegliere una volta
  const names = new Set([...Object.keys(core), ...Object.keys(shelters), ...Object.values(perSite).flatMap(Object.keys)])
  for (const name of names) {
    const comp = resolveForSite(name)
    if (comp) app.component(name, comp)
  }
  app.component('NuxtLink', NuxtLink)
  app.component('ClientOnly', ClientOnly)
  app.component('NuxtRouteAnnouncer', Empty)
  app.component('NuxtLoadingIndicator', Empty)
}
