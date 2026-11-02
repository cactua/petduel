<script setup lang="ts">
// Molecola: chi ha creato l'immagine. Mentre si scrive il nome propone gli artisti registrati:
// sceglierne uno lo collega al suo profilo, altrimenti restano nome e link scritti a mano (facoltativi).
// La usano i moduli di caricamento solo sui siti con askCredit in site.config.ts
const credit = defineModel<{ credit: string, creditUrl: string, artist: string }>({ required: true })
const id = useId()

const matches = ref<string[]>([])
let timer: ReturnType<typeof setTimeout> | undefined
let asked = ''

watch(() => credit.value.credit, (name) => {
  clearTimeout(timer)
  const q = name.trim().replace(/^@/, '')
  if (!q) {
    matches.value = []
    return
  }
  // Una richiesta ogni pausa nella scrittura, non una per lettera
  timer = setTimeout(async () => {
    asked = q
    try {
      const found = await $fetch<string[]>('/api/artists', { query: { q } })
      if (asked === q) matches.value = found
    }
    catch {
      matches.value = []
    }
  }, 250)
})
onBeforeUnmount(() => clearTimeout(timer))

// Campi cambiati uno per uno: i moduli passano un oggetto reactive, che non si può sostituire
function pick(username: string) {
  Object.assign(credit.value, { credit: '', creditUrl: '', artist: username })
  matches.value = []
}

function unpick() {
  credit.value.artist = ''
}
</script>

<template>
  <div class="credit-fields">
    <div v-if="credit.artist" class="field">
      <span class="label">{{ $t('upload.credit') }}</span>
      <div class="credit-fields__chosen">
        <span>🎨 @{{ credit.artist }}</span>
        <button type="button" class="credit-fields__unpick" :aria-label="$t('upload.artistRemove')" @click="unpick">✕</button>
      </div>
    </div>
    <template v-else>
      <div class="field credit-fields__search">
        <label :for="`${id}-name`" class="label">{{ $t('upload.credit') }} <small>({{ $t('common.optional') }})</small></label>
        <input
          :id="`${id}-name`" v-model="credit.credit" maxlength="60" :placeholder="$t('upload.creditPlaceholder')" autocomplete="off" class="input"
          role="combobox" :aria-expanded="matches.length > 0" :aria-controls="`${id}-list`"
        >
        <ul v-if="matches.length" :id="`${id}-list`" class="credit-fields__matches" role="listbox" :aria-label="$t('upload.artistMatches')">
          <li v-for="m in matches" :key="m" role="option" aria-selected="false">
            <button type="button" class="credit-fields__match" @click="pick(m)">🎨 @{{ m }}</button>
          </li>
        </ul>
      </div>
      <div v-if="credit.credit.trim()" class="field">
        <label :for="`${id}-url`" class="label">{{ $t('upload.creditUrl') }} <small>({{ $t('common.optional') }})</small></label>
        <input :id="`${id}-url`" v-model="credit.creditUrl" type="url" inputmode="url" maxlength="200" placeholder="https://" autocomplete="off" class="input">
      </div>
    </template>
    <small class="credit-fields__help">{{ $t('upload.creditHelp') }}</small>
  </div>
</template>

<style lang="scss" scoped>
.credit-fields {
  @include stack($space-3);

  &__matches {
    @include stack(2px);
    margin: $space-2 0 0;
    padding: $space-2;
    list-style: none;
    border: 2px solid var(--line);
    border-radius: $radius-md;
    background: var(--surface);
  }

  &__match {
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    text-align: left;
    cursor: pointer;

    &:hover, &:focus-visible { background: var(--coral-soft); }
  }

  &__chosen {
    display: inline-flex;
    gap: $space-3;
    align-items: center;
    align-self: flex-start;
    padding: 6px 6px 6px 14px;
    border-radius: $radius-pill;
    background: var(--coral-soft);
    font-weight: 800;
  }

  &__unpick {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: var(--surface);
    color: var(--muted);
    font-weight: 900;
    cursor: pointer;
  }

  &__help { color: var(--muted); font-size: 12px; }
}
</style>
