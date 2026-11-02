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
    <h1 class="rules-page__title">{{ $t('rules.title') }}</h1>
    <p class="rules-page__lead">{{ $t('rules.intro') }}</p>
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
.rules-page {
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  @include stack($space-6);
  padding-bottom: 16px;

  &__title { font-family: var(--display); font-size: clamp(26px, 5vw, 34px); text-wrap: balance; }

  &__lead, &__outro { margin: 0; line-height: 1.55; }

  &__outro { color: var(--muted); }

  &__list {
    @include stack($space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    gap: $space-5;
    align-items: flex-start;
    @include card(16px 18px, 22px);
  }

  &__emoji { font-size: 26px; line-height: 1; }

  &__text { min-width: 0; @include stack($space-2); }

  &__name { font-size: 18px; }

  &__body { margin: 0; line-height: 1.5; }
}
</style>
