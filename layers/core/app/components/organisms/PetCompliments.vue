<script setup lang="ts">
import { COMPLIMENTS, COMPLIMENT_EMOJI, type ComplimentKind, type PetCompliments } from '#shared/models'

// Organismo: complimenti già pronti, al posto dei commenti. Chi li fa vede solo i propri;
// proprietario e artista vedono quanti ne sono arrivati. Niente testo libero, quindi niente insulti
const props = defineProps<{ petId: number }>()

const { loggedIn } = useUserSession()
const route = useRoute()
const { data, refresh } = useLazyFetch<PetCompliments>(() => `/api/pets/${props.petId}/compliments`, { server: false })
const busy = ref<ComplimentKind | null>(null)
const error = ref('')

const received = computed(() => COMPLIMENTS.filter(k => data.value?.counts?.[k]))

async function toggle(kind: ComplimentKind) {
  if (!loggedIn.value) return navigateTo({ path: '/accedi', query: { redirect: route.fullPath } })
  if (!data.value?.canGive || busy.value) return
  const on = !data.value.mine.includes(kind)
  busy.value = kind
  error.value = ''
  // Subito sullo schermo, poi si conferma col server
  data.value.mine = on ? [...data.value.mine, kind] : data.value.mine.filter(k => k !== kind)
  try {
    await $fetch(`/api/pets/${props.petId}/compliments`, { method: 'POST', body: { kind, on } })
  }
  catch (e) {
    error.value = errorMessage(e)
    await refresh()
  }
  finally {
    busy.value = null
  }
}
</script>

<template>
  <section v-if="data && (data.counts || data.canGive || !loggedIn)" class="pet-compliments" aria-labelledby="compliments-title">
    <template v-if="data.counts">
      <h2 id="compliments-title" class="pet-compliments__title">💌 {{ $t('compliments.received') }}</h2>
      <ul v-if="received.length" class="pet-compliments__list">
        <li v-for="k in received" :key="k" class="pet-compliments__got">
          <span aria-hidden="true">{{ COMPLIMENT_EMOJI[k] }}</span> {{ $t(`compliments.${k}`) }} <b>{{ data.counts[k] }}</b>
        </li>
      </ul>
      <p v-else class="pet-compliments__empty">{{ $t('compliments.none') }}</p>
      <p class="pet-compliments__help">{{ $t('compliments.private') }}</p>
    </template>
    <template v-else>
      <h2 id="compliments-title" class="pet-compliments__title">💌 {{ $t('compliments.give') }}</h2>
      <div class="pet-compliments__list" role="group" :aria-labelledby="'compliments-title'">
        <button
          v-for="k in COMPLIMENTS" :key="k" type="button" class="pet-compliments__chip"
          :class="{ 'is-on': data.mine.includes(k) }" :aria-pressed="data.mine.includes(k)" :disabled="busy === k"
          @click="toggle(k)"
        >
          <span aria-hidden="true">{{ COMPLIMENT_EMOJI[k] }}</span> {{ $t(`compliments.${k}`) }}
        </button>
      </div>
      <p class="pet-compliments__help">{{ loggedIn ? $t('compliments.giveHelp') : $t('compliments.login') }}</p>
    </template>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>

<style lang="scss" scoped>
.pet-compliments {
  @include card(16px 18px, 22px);
  @include stack($space-4);

  &__title { font-size: 18px; }

  &__list {
    @include cluster($space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__chip, &__got {
    display: inline-flex;
    gap: $space-2;
    align-items: center;
    @include pill(7px, 14px);
    border: 2px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 800;
  }

  &__chip {
    cursor: pointer;

    &.is-on { border-color: var(--action); background: var(--coral-soft); }

    &:disabled { opacity: .6; cursor: default; }
  }

  &__got b { color: var(--coral); }

  &__empty, &__help { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
}
</style>
