<script setup lang="ts">
import site from '#site'
import { LEGAL_UPDATED, type LegalKey, type LegalTexts } from '../../legal/types'
import it from '../../legal/it'
import en from '../../legal/en'
import es from '../../legal/es'
import fr from '../../legal/fr'
import de from '../../legal/de'

// Privacy, cookie e termini: testi lunghi, uno per lingua in app/legal (non nei file di traduzione)
const props = defineProps<{ doc: LegalKey }>()
const TEXTS: Record<string, LegalTexts> = { it, en, es, fr, de }
const LINKS: Record<LegalKey, string> = { privacy: '/privacy', cookie: '/cookie', terms: '/termini' }

const { locale } = useI18n()
const texts = computed<LegalTexts>(() => TEXTS[locale.value] ?? it)
const page = computed(() => texts.value.docs[props.doc])
useHead({ title: () => `${page.value.title}` })

// Titolare ed email arrivano dal file .env; finché mancano si vede chiaramente cosa completare
const { legal } = useRuntimeConfig().public
const fill = (s: string) => s
  .replaceAll('{site}', site.name)
  .replace('{owner}', legal.owner || `[${texts.value.missing}: NUXT_PUBLIC_LEGAL_OWNER]`)
  .replace('{email}', legal.email || `[${texts.value.missing}: NUXT_PUBLIC_LEGAL_EMAIL]`)
const updated = computed(() => texts.value.updated.replace('{date}',
  new Date(`${LEGAL_UPDATED}T12:00:00`).toLocaleDateString(intlLocale(), { day: 'numeric', month: 'long', year: 'numeric' })))
const others = computed(() => (Object.keys(LINKS) as LegalKey[]).filter(k => k !== props.doc))
</script>

<template>
  <article class="legal-page">
    <header class="legal-page__head">
      <h1 class="legal-page__title">{{ page.title }}</h1>
      <p class="legal-page__updated">{{ updated }}</p>
      <p class="legal-page__intro">{{ fill(page.intro) }}</p>
    </header>

    <section v-for="s in page.sections" :key="s.h" class="legal-page__section">
      <h2 class="legal-page__heading">{{ s.h }}</h2>
      <p v-for="p in s.p" :key="p" class="legal-page__text">{{ fill(p) }}</p>
      <ul v-if="s.list" class="legal-page__list">
        <li v-for="item in s.list" :key="item" class="legal-page__text">{{ fill(item) }}</li>
      </ul>
      <div v-if="s.table" class="legal-page__table-wrap">
        <table class="legal-page__table">
          <thead><tr><th v-for="h in s.table.head" :key="h" scope="col">{{ h }}</th></tr></thead>
          <tbody>
            <tr v-for="row in s.table.rows" :key="row[0]">
              <td v-for="(cell, i) in row" :key="i"><code v-if="i === 0" class="legal-page__code">{{ cell }}</code><template v-else>{{ cell }}</template></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer class="legal-page__foot">
      <b>{{ texts.seeAlso }}</b>
      <NuxtLink v-for="k in others" :key="k" :to="LINKS[k]" class="legal-page__link">{{ texts.docs[k].title }}</NuxtLink>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
// Organismo: pagina legale (privacy, cookie, termini)
.legal-page {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  @include card(24px clamp(18px, 4vw, 40px) 28px, 28px);
  @include stack(22px);

  &__head { @include stack($space-2); }

  &__title { margin: 0; font-size: clamp(26px, 5vw, 34px); }

  &__updated { margin: 0; color: var(--muted); font-weight: 700; font-size: 13px; }

  &__intro { margin: 6px 0 0; font-size: 16px; line-height: 1.55; }

  &__section { @include stack($space-3); }

  &__heading { margin: 0; font-size: 20px; color: var(--coral-deep); }

  &__text { margin: 0; line-height: 1.6; font-size: 15px; overflow-wrap: anywhere; }

  &__list { margin: 0; padding-left: 20px; @include stack($space-2); }

  &__table-wrap { overflow-x: auto; }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }

    th { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
  }

  &__code { font-size: 13px; background: var(--bg); padding: 2px 6px; border-radius: 6px; white-space: nowrap; }

  &__foot { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; padding-top: 14px; border-top: 1px solid var(--line); }

  &__link { color: var(--coral-deep); font-weight: 800; }
}
</style>
