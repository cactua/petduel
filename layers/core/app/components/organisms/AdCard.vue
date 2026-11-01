<script setup lang="ts">
import { isNetworkAd, type AdCrop, type ShownAd } from '#shared/models'

// Pubblicità tra un duello e l'altro: occupa il posto dell'arena finché non si tocca "Continua".
// In anteprima (admin) non conta la visualizzazione e il link non porta da nessuna parte;
// con "crop" l'immagine è l'originale, posizionata come nell'editor.
// Un annuncio del circuito (Google) riempie il riquadro da solo: se è bloccato o Google non ha
// niente da mostrare si va avanti senza far aspettare nessuno
const props = defineProps<{ ad: ShownAd, preview?: boolean, crop?: AdCrop | null }>()
const emit = defineEmits<{ continue: [] }>()

const own = computed(() => isNetworkAd(props.ad) ? null : props.ad)
const net = computed(() => isNetworkAd(props.ad) ? props.ad : null)
const adtest = import.meta.dev ? 'on' : undefined
const slotEl = ref<HTMLElement>()

// Il pulsante per andare avanti arriva dopo un attimo: chi stava trascinando non lo tocca per sbaglio
const ready = ref(props.preview)
let done = false
const skip = () => { if (!done) { done = true; emit('continue') } }
let observer: MutationObserver | undefined
let giveUp: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => { done = true; observer?.disconnect(); clearTimeout(giveUp) })

onMounted(() => {
  if (props.preview) return
  setTimeout(() => (ready.value = true), 900)
  if (own.value) $fetch(`/api/ads/${own.value.id}/view`, { method: 'POST' }).catch(() => {})
  else if (net.value) showNetwork(net.value.client)
})

const { consent } = useConsent()
async function showNetwork(client: string) {
  // Annuncio Google senza consenso (es. scelto prima del rifiuto): si salta senza caricare nulla
  if (consent.value !== 'ads') return skip()
  try {
    await loadAdsense(client)
  } catch {
    return skip() // script bloccato (ad blocker, rete)
  }
  const ins = slotEl.value
  if (!ins || done) return
  // Google scrive l'esito sul riquadro: "filled" conta come visualizzazione, "unfilled" si salta
  observer = new MutationObserver(() => {
    const status = ins.dataset.adStatus
    if (status === 'filled') {
      observer?.disconnect(); clearTimeout(giveUp)
      $fetch('/api/ads/network/view', { method: 'POST' }).catch(() => {})
    } else if (status === 'unfilled') skip()
  })
  observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })
  giveUp = setTimeout(() => { if (!ins.dataset.adStatus) skip() }, 8000)
  try {
    ((window as Window & { adsbygoogle?: object[] }).adsbygoogle ||= []).push({})
  } catch {
    skip()
  }
}
</script>

<template>
  <article class="ad-card" :aria-label="$t('ad.label')">
    <p class="ad-card__label">{{ $t('ad.sponsored') }}<template v-if="own?.advertiser"> · {{ own.advertiser }}</template></p>
    <div v-if="net" class="ad-card__body ad-card__body--network">
      <ins
        ref="slotEl" class="adsbygoogle ad-card__slot" :data-ad-client="net.client" :data-ad-slot="net.slot"
        data-ad-format="auto" data-full-width-responsive="true" :data-adtest="adtest"
      />
    </div>
    <a
      v-else-if="own"
      :href="preview ? undefined : own.href" class="ad-card__body" target="_blank" rel="sponsored noopener"
      @click="preview && $event.preventDefault()"
    >
      <span v-if="own.image && crop" class="ad-card__media"><span class="ad-card__stage" :style="{ background: crop.bg }"><img :src="own.image" alt="" class="ad-card__crop" :style="adCropStyle(crop)"></span></span>
      <span v-else-if="own.image" class="ad-card__media"><img :src="own.image" alt="" class="ad-card__img"></span>
      <span v-else class="ad-card__media ad-card__media--placeholder" aria-hidden="true">📣</span>
      <span class="ad-card__text">
        <b class="ad-card__title">{{ own.title }}</b>
        <span v-if="own.body" class="ad-card__desc">{{ own.body }}</span>
      </span>
      <span class="ad-card__cta">{{ own.cta }}</span>
    </a>
    <button type="button" class="ad-card__next" :disabled="!ready" @click="emit('continue')">{{ $t('ad.continue') }} →</button>
  </article>
</template>

<style lang="scss" scoped>
// Organismo: annuncio tra un duello e l'altro (nostro o della rete)
.ad-card {
  flex: 1;
  min-height: 0;
  @include stack($space-4);
  padding: 12px;
  background: var(--surface);
  border-radius: 30px;
  box-shadow: 0 16px 26px -18px var(--glow);

  @include mq(md) { max-width: 560px; width: 100%; align-self: center; }

  &__label { margin: 0; @include eyebrow(12px); font-weight: 800; letter-spacing: .04em; padding-left: 4px; }

  &__body {
    flex: 1;
    min-height: 0;
    @include stack($space-4);
    @include plain-link(var(--ink));

    // Il riquadro di Google: prende tutto lo spazio della card, Google sceglie il formato
    &--network { justify-content: center; overflow: hidden; border-radius: 22px; }
  }

  &__slot { display: block; width: 100%; min-height: 120px; }

  // L'immagine (4:3) riempie lo spazio libero della card, come le foto nei duelli:
  // se lo spazio ha un'altra forma si taglia un po' ai lati o sopra e sotto, sempre dal centro
  &__media {
    position: relative;
    flex: 1;
    min-height: 120px;
    width: 100%;
    overflow: hidden;
    border-radius: 22px;
    background: var(--bg);
    container-type: size;

    &--placeholder { display: grid; place-items: center; font-size: 56px; }
  }

  &__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

  // Anteprima dall'originale: una cornice 4:3 che copre lo spazio come farebbe object-fit: cover
  &__stage { position: absolute; left: 50%; top: 50%; width: max(100cqw, 100cqh * 4 / 3); aspect-ratio: 4 / 3; transform: translate(-50%, -50%); overflow: hidden; }

  &__crop { position: absolute; max-width: none; pointer-events: none; }

  &__text { @include stack(2px); padding: 0 4px; }

  &__title { font-family: var(--display); font-size: 22px; line-height: 1.2; }

  &__desc { color: var(--muted); font-size: 15px; }

  &__cta { align-self: stretch; text-align: center; background: var(--action); color: #fff; border-radius: $radius-pill; padding: 13px; font-weight: 900; }

  &__next {
    border: 0;
    background: none;
    color: var(--ink);
    font-weight: 800;
    padding: 8px;
    cursor: pointer;
    font-size: 15px;

    &:disabled { opacity: .35; cursor: default; }
  }
}
</style>
