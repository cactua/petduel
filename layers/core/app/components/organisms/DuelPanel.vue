<script setup lang="ts">
import { ANON_VOTE_WEIGHT, type Duel, type ShownAd } from '#shared/models'

// Area di gioco con tutti gli stati: duello, finito, errore, caricamento, più suggerimento e toast
const props = defineProps<{
  duel: Duel | null
  failed: boolean
  votes: number
  hint: string
  toast: string
  result?: { index: number, delta: number } | null
  celebrate?: number
  ad?: ShownAd | null
  emptyText?: string
}>()
const emit = defineEmits<{ vote: [index: number], skip: [], retry: [], adContinue: [] }>()

// Chi vota senza account, dopo qualche voto, scopre che con l'account i voti contano di più
const NUDGE_AFTER = 10
const NUDGE_KEY = 'petduel:nudge-chiuso'
const { loggedIn } = useUserSession()
const route = useRoute()
const nudgeClosed = ref(true)
onMounted(() => {
  try { nudgeClosed.value = localStorage.getItem(NUDGE_KEY) === '1' }
  catch { nudgeClosed.value = false }
})
function closeNudge() {
  nudgeClosed.value = true
  try { localStorage.setItem(NUDGE_KEY, '1') }
  catch { /* senza storage si richiude solo per questa visita */ }
}
const showNudge = computed(() => !loggedIn.value && !nudgeClosed.value && props.votes >= NUDGE_AFTER && !props.hint && !props.ad)
const weightTimes = Math.round(1 / ANON_VOTE_WEIGHT)

const CONFETTI_COLORS = ['var(--coral)', 'var(--sun)', 'var(--heart)', 'var(--mint)', '#7cc3f0', '#b9a4ff']
const confetti = Array.from({ length: 28 }, (_, i) => ({
  '--x': `${Math.round((Math.random() - 0.5) * 340)}px`,
  '--y': `${Math.round(-140 - Math.random() * 220)}px`,
  '--r': `${Math.round(Math.random() * 720 - 360)}deg`,
  '--d': `${Math.round(Math.random() * 120)}ms`,
  'background': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))
</script>

<template>
  <div class="duel-panel">
    <AdCard v-if="ad" :key="`ad-${votes}`" :ad="ad" @continue="emit('adContinue')" />
    <DuelArena
      v-else-if="duel?.pets"
      :key="duel.token!"
      :pets="duel.pets"
      :coach="votes === 0"
      :result="result"
      @vote="emit('vote', $event)"
    />
    <div v-else-if="duel" class="duel-panel__empty">
      <SiteMascot class="duel-panel__mascot" />
      <slot name="empty">
        <p>{{ emptyText ?? `${$t('duel.allVoted')} 🎉` }}</p>
      </slot>
    </div>
    <div v-else-if="failed" class="duel-panel__empty">
      <SiteMascot still class="duel-panel__mascot" />
      <p>{{ $t('duel.loadFailed') }}</p>
      <button type="button" class="btn btn--primary" @click="emit('retry')">{{ $t('common.retry') }}</button>
    </div>
    <!-- Sagoma delle due card mentre arriva il duello: stessa impaginazione, niente salto quando compaiono -->
    <div v-else class="duel-panel__skeleton" aria-busy="true" :aria-label="$t('duel.loading')">
      <div v-for="i in 2" :key="i" class="duel-panel__ghost"><span class="duel-panel__ghost-photo" /><span class="duel-panel__ghost-line" /></div>
    </div>
    <!-- Fuori dalla catena v-if/v-else sopra: dentro, quando sparisce farebbe comparire il riquadro "hai votato tutto" -->
    <!-- Segnala sotto ogni card (dalla parte della card), Salta in mezzo -->
    <div v-if="!ad && duel?.pets && !result && !hint" class="duel-panel__extras">
      <ReportButton v-if="duel.pets[0].photoId" :photo-id="duel.pets[0].photoId" :label="$t('report.openNamed', { name: duel.pets[0].name })" class="duel-panel__report" />
      <button type="button" class="duel-panel__skip" @click="emit('skip')">{{ $t('duel.skip') }} →</button>
      <ReportButton v-if="duel.pets[1].photoId" :photo-id="duel.pets[1].photoId" :label="$t('report.openNamed', { name: duel.pets[1].name })" class="duel-panel__report duel-panel__report--end" />
    </div>

    <p v-if="showNudge" class="duel-panel__nudge">
      <i18n-t keypath="duel.nudge" tag="span" class="duel-panel__nudge-text"><template #times><b>{{ $t('duel.nudgeTimes', { n: weightTimes }) }}</b></template></i18n-t>
      <NuxtLink :to="{ path: '/signup', query: { redirect: route.fullPath } }" class="duel-panel__nudge-link">{{ $t('duel.signUp') }}</NuxtLink>
      <button type="button" class="duel-panel__nudge-close" :aria-label="$t('common.close')" @click="closeNudge">✕</button>
    </p>
    <p v-else class="duel-panel__hint">
      <template v-if="ad">{{ $t('ad.thanks') }}</template>
      <template v-else-if="hint">{{ hint }}</template>
      <template v-else><i18n-t keypath="duel.hint"><template #over><b>{{ $t('duel.hintOver') }}</b></template></i18n-t><span class="duel-panel__hint-more"> · {{ $t('duel.hintHold') }}</span></template>
    </p>
    <Transition name="pop">
      <div v-if="toast" class="duel-panel__toast" role="status">{{ toast }}</div>
    </Transition>
    <div v-if="celebrate" :key="celebrate" class="duel-panel__confetti" aria-hidden="true">
      <i v-for="(c, i) in confetti" :key="i" class="duel-panel__confetto" :style="c" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: area del duello con stato vuoto, sagoma di caricamento, suggerimenti e coriandoli
.duel-panel {
  flex: 1;
  min-height: 0;
  @include stack($space-4);
  position: relative;

  &__extras {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: $space-2;
    color: var(--muted);
  }

  &__report { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__report--end { text-align: right; }

  &__skip {
    border: 0;
    padding: 2px 10px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;

    &:hover, &:focus-visible { color: var(--ink); text-decoration: underline; }
  }

  &__hint {
    margin: 0;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    min-height: 18px;

    b { color: var(--ink); }
  }

  // Il consiglio in più solo dove c'è spazio per una riga sola
  &__hint-more { @include mq-down(md) { display: none; } }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-5;
    border-radius: 30px;
    background: var(--surface);
    color: var(--muted);
    text-align: center;
    padding: 24px;
    box-shadow: 0 10px 22px -12px var(--shadow);

    // Link passati dalla pagina nello slot "empty"
    :deep(a) {
      background: var(--action);
      color: #fff;
      @include pill(10px, 18px);
      box-shadow: 0 10px 18px -8px var(--glow);
      font-weight: 700;
      text-decoration: none;
    }
  }

  &__mascot { width: 92px; height: 84px; }

  // Stessi margini e spazi dell'arena (DuelArena)
  &__skeleton {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 6px 4px;

    @include mq(md) { flex-direction: row; gap: 40px; padding-top: 34px; }
  }

  &__ghost {
    flex: 1;
    min-height: 0;
    @include stack($space-3);
    padding: 5px 5px 10px;
    background: var(--surface);
    border-radius: 28px;
    box-shadow: 0 16px 26px -18px var(--glow);

    @include mq(md) { border-radius: 30px; padding: 6px 6px 12px; }
  }

  &__ghost-photo, &__ghost-line {
    background: linear-gradient(100deg, var(--line) 30%, var(--bg) 50%, var(--line) 70%) 0 0 / 300% 100%;
    animation: shimmer 1.4s linear infinite;

    @media (prefers-reduced-motion: reduce) { animation: none; }
  }

  &__ghost-photo { flex: 1; border-radius: 23px; }

  &__ghost-line { height: 14px; width: 45%; margin-left: 8px; border-radius: $radius-pill; }

  &__toast {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 6;
    white-space: nowrap;
    background: var(--sun);
    color: var(--sun-ink);
    @include pill(12px, 20px);
    font-family: var(--display);
    font-size: 17px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, .2);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  &__nudge {
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-3;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    background: var(--coral-soft);
    border-radius: $radius-pill;
    padding: 4px 4px 4px 14px;
    min-height: 18px;
  }

  &__nudge-text { flex: 1; min-width: 0; }

  &__nudge-link { background: var(--action); color: #fff; @include pill(5px, 12px); text-decoration: none; font-weight: 800; flex-shrink: 0; }

  &__nudge-close { border: 0; background: none; color: var(--muted); cursor: pointer; padding: 4px 8px; flex-shrink: 0; }

  // Coriandoli: partono dal centro dell'arena e ricadono
  &__confetti {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 7;
    pointer-events: none;

    @media (prefers-reduced-motion: reduce) { display: none; }
  }

  &__confetto {
    position: absolute;
    width: 9px;
    height: 14px;
    border-radius: 3px;
    opacity: 0;
    animation: confetto 1.3s cubic-bezier(.15, .7, .3, 1) var(--d) forwards;

    &:nth-child(3n) { width: 11px; height: 11px; border-radius: 50%; }
  }
}

@keyframes shimmer {
  from { background-position: 100% 0; }
  to { background-position: 0 0; }
}

@keyframes confetto {
  0% { opacity: 1; transform: translate(0, 0) rotate(0); }
  60% { opacity: 1; transform: translate(var(--x), var(--y)) rotate(var(--r)); }
  100% { opacity: 0; transform: translate(var(--x), calc(var(--y) + 160px)) rotate(var(--r)); }
}

.pop-enter-active, .pop-leave-active { transition: opacity .25s, transform .25s; }

.pop-enter-from, .pop-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(.9); }
</style>
