<script setup lang="ts">
// Molecola: chi ha creato l'immagine (nome e link dell'artista, facoltativi).
// La usano i moduli di caricamento solo sui siti con askCredit in site.config.ts
const credit = defineModel<{ credit: string, creditUrl: string }>({ required: true })
const id = useId()
</script>

<template>
  <div class="credit-fields">
    <div class="field">
      <label :for="`${id}-name`" class="label">{{ $t('upload.credit') }} <small>({{ $t('common.optional') }})</small></label>
      <input :id="`${id}-name`" v-model="credit.credit" maxlength="60" :placeholder="$t('upload.creditPlaceholder')" autocomplete="off" class="input">
    </div>
    <div v-if="credit.credit.trim()" class="field">
      <label :for="`${id}-url`" class="label">{{ $t('upload.creditUrl') }} <small>({{ $t('common.optional') }})</small></label>
      <input :id="`${id}-url`" v-model="credit.creditUrl" type="url" inputmode="url" maxlength="200" placeholder="https://" autocomplete="off" class="input">
    </div>
    <small class="credit-fields__help">{{ $t('upload.creditHelp') }}</small>
  </div>
</template>

<style lang="scss" scoped>
.credit-fields {
  @include stack($space-3);

  &__help { color: var(--muted); font-size: 12px; }
}
</style>
