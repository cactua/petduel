<script setup lang="ts">
// Pagina: regole della community, brevi e amichevoli. Si accettano all'iscrizione; testi in rules.* (ogni sito li adatta)
const { t } = useI18n()
useHead({ title: () => t('rules.title') })

const RULES = [
  { key: 'kind', emoji: '💛' },
  { key: 'own', emoji: '📸' },
  { key: 'ai', emoji: '🤖' },
  { key: 'safe', emoji: '🛡️' },
  { key: 'privacy', emoji: '🔒' },
  { key: 'report', emoji: '⚑' },
] as const
</script>

<template>
  <article class="rules-page">
    <header class="rules-page__head">
      <h1 class="rules-page__title">{{ $t('rules.title') }}</h1>
      <p class="rules-page__lead">{{ $t('rules.intro') }}</p>
    </header>
    <ol class="rules-page__list">
      <li v-for="r in RULES" :key="r.key" class="rules-page__item">
        <span class="rules-page__emoji" aria-hidden="true">{{ r.emoji }}</span>
        <div class="rules-page__text">
          <h2 class="rules-page__name">{{ $t(`rules.items.${r.key}.title`) }}</h2>
          <p class="rules-page__body">{{ $t(`rules.items.${r.key}.text`) }}</p>
        </div>
      </li>
    </ol>
    <p class="rules-page__outro">{{ $t('rules.outro') }}</p>
  </article>
</template>

<style lang="scss" scoped>
// Larga quanto l'app: le regole in una griglia di card (1 colonna sul telefono, 2-3 su computer);
// introduzione e chiusura restano a una misura leggibile
.rules-page {
  width: 100%;
  @include stack($space-6);
  padding-bottom: 16px;

  &__head { @include stack($space-3); }

  &__title { margin: 0; font-family: var(--display); font-size: clamp(26px, 5vw, 34px); text-wrap: balance; }

  &__lead, &__outro { margin: 0; @include prose; }

  &__lead { font-size: 16px; }

  &__outro { color: var(--muted); }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: $space-4;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    gap: $space-5;
    align-items: flex-start;
    min-width: 0;
    @include card(16px 18px, 22px);
  }

  &__emoji { font-size: 26px; line-height: 1; }

  &__text { min-width: 0; @include stack($space-2); }

  &__name { font-size: 18px; text-wrap: balance; }

  &__body { margin: 0; line-height: 1.5; }
}
</style>
