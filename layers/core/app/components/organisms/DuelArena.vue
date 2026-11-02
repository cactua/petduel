<script setup lang="ts">
import type { PublicPet } from '#shared/models'

const props = defineProps<{ pets: [PublicPet, PublicPet], coach?: boolean, result?: { index: number, delta: number } | null }>()
const emit = defineEmits<{ vote: [index: number] }>()

// Oltre questa frazione del percorso verso l'avversario il voto è valido
const THRESHOLD = 0.4

const cards = ref<HTMLElement[]>([])
const winner = ref<number | null>(null)
const drag = reactive({ index: -1, progress: 0 })

interface Geometry { row: boolean, sign: number, dist: number }

// Direzione verso l'avversario (giù/su su mobile, destra/sinistra su desktop) e distanza per coprirlo
function geometry(i: number): Geometry {
  const row = matchMedia('(min-width: 760px)').matches
  const self = cards.value[i]!.getBoundingClientRect()
  const other = cards.value[1 - i]!.getBoundingClientRect()
  return { row, sign: i === 0 ? 1 : -1, dist: row ? Math.abs(other.left - self.left) : Math.abs(other.top - self.top) }
}
const translate = (g: Geometry, along: number, perp = 0) =>
  g.row ? `translate(${g.sign * along}px, ${perp}px)` : `translate(${perp}px, ${g.sign * along}px)`

function decide(i: number) {
  if (winner.value !== null) return
  stopCoach()
  const g = geometry(i)
  winner.value = i
  drag.index = -1
  cards.value[i]!.style.transform = `${translate(g, g.dist)} scale(1.02)`
  emit('vote', i)
}

// Tieni premuto senza muoverti: la foto si apre intera finché non alzi il dito
const PEEK_MS = 420
const PEEK_SLOP = 8 // px di tremolio tollerati prima di considerarlo un trascinamento
const peek = ref<number | null>(null)
const peekPhotos = computed(() => props.pets.map(p => ({ image: p.image, alt: [p.name, p.breed].filter(Boolean).join(', ') })))
let peekTimer: ReturnType<typeof setTimeout> | undefined
const cancelPeek = () => clearTimeout(peekTimer)

// Gesto: trascina il preferito sopra l'altro. Clic e tocchi senza trascinamento non votano.
let start = { x: 0, y: 0 }
let g: Geometry | null = null

function onDown(i: number, e: PointerEvent) {
  if (winner.value !== null || !e.isPrimary || e.button !== 0) return // niente tasto destro né secondo dito
  stopCoach()
  start = { x: e.clientX, y: e.clientY }
  g = geometry(i)
  drag.index = i
  drag.progress = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  cancelPeek()
  peekTimer = setTimeout(() => {
    if (drag.index !== i) return
    cards.value[i]!.style.transform = ''
    drag.progress = 0
    peek.value = i
  }, PEEK_MS)
}

function onMove(i: number, e: PointerEvent) {
  if (drag.index !== i || !g || peek.value !== null) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (Math.hypot(dx, dy) > PEEK_SLOP) cancelPeek()
  let along = (g.row ? dx : dy) * g.sign
  if (along < 0) along *= 0.25 // resistenza nella direzione sbagliata
  along = Math.min(along, g.dist)
  drag.progress = Math.max(0, along / (g.dist * THRESHOLD))
  cards.value[i]!.style.transform = `${translate(g, along, (g.row ? dy : dx) * 0.15)} scale(${1 + Math.min(drag.progress, 1) * 0.03})`
}

function onUp(i: number) {
  cancelPeek()
  if (peek.value !== null) {
    peek.value = null
    drag.index = -1
    return
  }
  if (drag.index !== i) return
  if (drag.progress >= 1) return decide(i)
  cards.value[i]!.style.transform = ''
  drag.index = -1
  drag.progress = 0
}

const creditOpen = ref<number | null>(null)

const p = computed(() => Math.min(drag.progress, 1))
const stampOpacity = (i: number) => (winner.value === i ? 1 : drag.index === i ? p.value : 0)
const cardOpacity = (i: number) => (drag.index === 1 - i ? 1 - p.value * 0.35 : undefined)
const vsOpacity = computed(() => (winner.value !== null ? 0 : drag.index >= 0 ? 1 - p.value : 1))

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') decide(0)
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') decide(1)
}

// Demo iniziale: la prima card accenna il gesto finché non si tocca qualcosa
let coachAnim: Animation | null = null
function stopCoach() {
  coachAnim?.cancel()
  coachAnim = null
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (props.coach && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const g0 = geometry(0)
    coachAnim = cards.value[0]!.animate(
      [{ transform: 'none' }, { transform: `${translate(g0, Math.min(70, g0.dist * 0.3))} scale(1.02)`, offset: 0.45 }, { transform: 'none' }],
      { duration: 1100, iterations: 3, delay: 700, easing: 'ease-in-out' },
    )
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  stopCoach()
  cancelPeek()
})
</script>

<template>
  <div class="duel-arena">
    <div
      v-for="(pet, i) in pets"
      :key="pet.id"
      :ref="el => { if (el) cards[i] = el as HTMLElement }"
      class="duel-arena__card"
      :class="[i === 0 ? 'duel-arena__card--first' : 'duel-arena__card--second', { 'is-dragging': drag.index === i, 'is-winner': winner === i, 'is-loser': winner === 1 - i }]"
      :data-i="i"
      :style="{ opacity: cardOpacity(i) }"
      tabindex="0"
      role="button"
      :aria-label="$t('duel.makeWin', { name: pet.name })"
      @pointerdown="onDown(i, $event)"
      @pointermove="onMove(i, $event)"
      @pointerup="onUp(i)"
      @pointercancel="onUp(i)"
      @keydown.enter.prevent="decide(i)"
      @keydown.space.prevent="decide(i)"
      @contextmenu.prevent
    >
      <!-- Cornice morbida con le orecchie della specie; il trascinamento muove la card esterna -->
      <div class="duel-arena__frame">
        <PetEars :species="pet.species" />
        <div class="duel-arena__photo">
          <picture><source v-for="s in photoSources(pet.image, 'h', '(min-width: 760px) 480px, 92vw', 'v')" :key="`${s.media}${s.type}`" v-bind="s"><img :src="pet.image" :alt="`${pet.name}, ${pet.breed}`" draggable="false" class="duel-arena__img"></picture>
          <span v-if="pet.adoption === 'available' || pet.adoption === 'fostered'" class="duel-arena__ribbon">🏠 {{ $t(`adoption.status.${pet.adoption}`) }}</span>
          <span class="duel-arena__stamp" :style="{ opacity: stampOpacity(i) }">{{ $t('duel.wins') }}</span>
          <!-- Solo sul vincitore: la sua card scivola sopra quella del perdente e la copre -->
          <span v-if="result?.index === i && result.delta > 0" class="duel-arena__gain" aria-hidden="true">+1 ♥</span>
          <svg class="duel-arena__arrows" viewBox="0 0 36 54" aria-hidden="true">
            <path d="M6 6l12 10 12-10" /><path d="M6 20l12 10 12-10" /><path d="M6 34l12 10 12-10" />
          </svg>
          <!-- Autore e licenza dietro una "i": la scritta fissa copriva la foto -->
          <span v-if="pet.credit" class="duel-arena__credit" @pointerdown.stop @keydown.stop>
            <CreditLink
              v-if="creditOpen === i" :url="pet.credit.url"
              class="duel-arena__credit-link"
            >{{ $t('photo.credit', { text: pet.credit.text }) }}</CreditLink>
            <button
              type="button" class="duel-arena__credit-info" :class="{ 'is-open': creditOpen === i }" :aria-expanded="creditOpen === i" :aria-label="$t('photo.creditInfo')"
              @click.stop="creditOpen = creditOpen === i ? null : i"
            >i</button>
          </span>
        </div>
        <!-- Collare con medaglietta: nome, razza e città -->
        <div class="duel-arena__collar">
          <span class="duel-arena__medal" :class="`duel-arena__medal--${pet.species}`"><AppIcon name="paw" /></span>
          <div class="duel-arena__who">
            <b class="duel-arena__name">{{ pet.name }}</b>
            <small class="duel-arena__meta">{{ [pet.breed, pet.city].filter(Boolean).join(' · ') }} · @{{ pet.owner }}</small>
          </div>
        </div>
      </div>
    </div>
    <!-- Toppa cucita sulla giunzione tra le due card, come la striscia della sfida -->
    <div class="duel-arena__vs" :style="{ opacity: vsOpacity }" aria-hidden="true">
      <span class="duel-arena__patch"><b class="duel-arena__patch-text">VS</b></span>
    </div>
    <PhotoViewer v-model="peek" :photos="peekPhotos" peek />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:list";

$scrim: rgba(30, 16, 10, .72);

// Colore della medaglietta per specie: sfondo, bordo inferiore, icona
$medals: (
  cane: (#ffc83d, #e9a400, #8a5a00),
  gatto: (#b9a4ff, #8d74e8, #fff),
  coniglio: (#ff9fb6, #e8728f, #fff),
  roditore: (#f5a65b, #d9853a, #fff),
  uccello: (#6cc68f, #45a46b, #fff),
  rettile: (#8cc56a, #69a347, #fff),
  altro: (#7cc3f0, #4ea2d6, #fff),
);

// Organismo: le due card del duello, da trascinare una sull'altra per votare
.duel-arena {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding: 16px 6px 4px;

  @include mq(md) { flex-direction: row; gap: 40px; padding-top: 34px; }

  &__card {
    flex: 1;
    min-height: 0;
    position: relative;
    z-index: 1;
    --ear: 36px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: transform .45s cubic-bezier(.2, .8, .2, 1), opacity .45s, filter .45s;

    &--second { --ear: 34px; }

    @include mq(md) { --ear: 50px; }

    @media (prefers-reduced-motion: reduce) { transition: none; }

    &.is-dragging { transition: none; cursor: grabbing; z-index: 4; }

    &.is-winner { z-index: 4; }

    &.is-loser { transform: scale(.82) !important; opacity: .35; filter: grayscale(.7); }
  }

  &__frame {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    padding: 5px;
    border-radius: 28px;
    box-shadow: 0 16px 26px -18px var(--glow);
    transition: box-shadow .3s;

    @include mq(md) { padding: 6px 6px 0; border-radius: 30px; }

    .is-dragging > & { box-shadow: 0 24px 40px -14px var(--glow); }

    .is-winner > & { box-shadow: 0 0 0 5px var(--sun), 0 22px 44px -12px var(--glow); }
  }

  &__photo { position: relative; flex: 1; min-height: 0; }

  &__img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; pointer-events: none; background: var(--line); }

  // Collare: su telefono nome e razza scendono sulla foto, che prende tutta l'altezza della card
  &__collar {
    display: flex;
    align-items: center;
    gap: $space-3;
    min-width: 0;
    position: absolute;
    left: 5px;
    right: 5px;
    bottom: 5px;
    padding: 28px 10px 8px 8px;
    border-radius: 0 0 23px 23px;
    background: linear-gradient(transparent, $scrim);
    pointer-events: none;

    @include mq(md) { position: static; padding: 6px 8px 7px 4px; border-radius: 0; background: none; pointer-events: auto; }
  }

  &__medal {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;

    .icon {
      width: 14px;
      height: 14px;

      @include mq(md) { width: 16px; height: 16px; }
    }

    @include mq(md) { width: 30px; height: 30px; }

    @each $species, $c in $medals {
      &--#{$species} { background: list.nth($c, 1); box-shadow: inset 0 -3px 0 list.nth($c, 2); color: list.nth($c, 3); }
    }
  }

  &__who { min-width: 0; flex: 1; display: flex; flex-direction: column; }

  &__name {
    font-family: var(--display);
    font-weight: 600;
    font-size: 18px;
    line-height: 1.05;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, .4);

    @include mq(md) { font-size: 19px; color: inherit; text-shadow: none; }
  }

  &__meta {
    font-size: 11px;
    font-weight: 800;
    color: rgba(255, 255, 255, .88);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @include mq(md) { color: var(--muted); }
  }

  &__credit {
    position: absolute;
    right: 10px;
    top: 10px;
    max-width: calc(100% - 20px);
    display: flex;
    align-items: center;
    gap: $space-2;

    @include mq(md) { top: auto; bottom: 10px; }
  }

  &__credit-link {
    min-width: 0;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    text-decoration: none;
    background: $scrim;
    @include pill(4px, 10px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__credit-info {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    background: rgba(30, 16, 10, .45);
    color: #fff;
    font: 800 italic 13px/1 Georgia, serif;

    &.is-open { background: $scrim; }
  }

  // Nastrino dei pet dei rifugi: in alto a sinistra, sempre leggibile sulla foto
  &__ribbon {
    position: absolute;
    left: 10px;
    top: 10px;
    pointer-events: none;
    background: var(--action);
    color: #fff;
    font-weight: 900;
    font-size: 12px;
    @include pill(4px, 10px);
    box-shadow: 0 4px 10px -4px rgba(0, 0, 0, .45);
  }

  &__stamp {
    position: absolute;
    right: 16px;
    top: 50%;
    margin-top: -20px;
    pointer-events: none;
    white-space: nowrap;
    background: var(--sun);
    color: var(--sun-ink);
    font-family: var(--display);
    font-weight: 700;
    font-size: 18px;
    @include pill(6px, 14px);
    transform: rotate(-8deg);
    box-shadow: 0 6px 14px -6px rgba(233, 164, 0, .9);
  }

  // Il cuore dell'ultimo voto: sale dal centro della foto e svanisce
  &__gain {
    position: absolute;
    left: 50%;
    top: 24%;
    pointer-events: none;
    font-family: var(--display);
    font-weight: 700;
    font-size: 34px;
    line-height: 1;
    color: #fff;
    @include pill(6px, 16px);
    background: var(--mint);
    box-shadow: 0 10px 22px -8px rgba(0, 0, 0, .45);
    animation: gain 1.1s cubic-bezier(.2, .8, .2, 1) forwards;

    @media (prefers-reduced-motion: reduce) { animation: none; transform: translateX(-50%); }
  }

  &__arrows {
    position: absolute;
    left: 50%;
    width: 36px;
    height: 54px;
    margin-left: -18px;
    pointer-events: none;
    color: #fff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .3));
    transition: opacity .2s;

    path {
      fill: none;
      stroke: currentColor;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      animation: chev 1.3s infinite;

      &:nth-child(2) { animation-delay: .18s; }

      &:nth-child(3) { animation-delay: .36s; }

      @media (prefers-reduced-motion: reduce) { animation: none; opacity: .8; }
    }

    .duel-arena__card--first & {
      bottom: 54px;

      @include mq(md) { top: 32%; bottom: auto; left: auto; right: 14px; margin-left: 0; transform: rotate(-90deg); }
    }

    .duel-arena__card--second & {
      top: 8px;
      transform: rotate(180deg);

      @include mq(md) { top: 32%; left: 14px; margin-left: 0; transform: rotate(90deg); }
    }

    .is-dragging &, .is-winner &, .is-loser & { opacity: 0; }
  }

  &__vs {
    --size: 58px;
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 5;
    pointer-events: none;
    width: var(--size);
    height: var(--size);
    margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
    transition: opacity .2s;

    @include mq(md) { --size: 72px; }
  }

  &__patch {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #ff6f61;
    border: 4px solid var(--surface);
    // Cucitura
    outline: 2px dashed rgba(255, 255, 255, .75);
    outline-offset: -11px;
    box-shadow: 0 10px 18px -8px rgba(232, 74, 60, .75), inset 0 -4px 0 rgba(0, 0, 0, .12);
    transform: rotate(-10deg);
    animation: beat 1.8s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) { animation: none; }
  }

  &__patch-text {
    font-family: var(--display);
    font-weight: 700;
    font-size: 19px;
    letter-spacing: .02em;
    color: #fff;
    line-height: 1;
    margin-top: -2px;

    @include mq(md) { font-size: 23px; }
  }
}

@keyframes gain {
  from { opacity: 0; transform: translate(-50%, 10px) scale(.6); }
  25% { opacity: 1; transform: translate(-50%, -6px) scale(1.08); }
  70% { opacity: 1; transform: translate(-50%, -22px) scale(1); }
  to { opacity: 0; transform: translate(-50%, -40px) scale(1); }
}

@keyframes chev {
  0%, 100% { opacity: .15; }
  40% { opacity: 1; }
}

// Doppio battito, come un cuore: invita a scegliere senza agitarsi troppo
@keyframes beat {
  0%, 60%, 100% { transform: rotate(-10deg) scale(1); }
  12% { transform: rotate(-10deg) scale(1.1); }
  24% { transform: rotate(-10deg) scale(1); }
  36% { transform: rotate(-10deg) scale(1.06); }
}
</style>
