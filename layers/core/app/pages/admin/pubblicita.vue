<script setup lang="ts">
import { AD_DEAL_DEFAULT, AD_LANGS, AD_NETWORK_DEFAULT, AD_TARGETING_DEFAULT, adFieldsSchema, adTextFor, isTranslated, type AdLang, type AdTranslations, adSettingsSchema, type AdCrop, type AdminAd, type AdminAds, type AdSettings } from '#shared/models'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Pubblicità · Admin' })

const { data, refresh, error: loadError } = await useFetch<AdminAds>('/api/admin/ads')

// --- Frequenza ---
const settings = reactive<AdSettings>({ every: 15, startAfter: 5, inChallenges: true, network: { ...AD_NETWORK_DEFAULT } })
watch(() => data.value?.settings, s => s && Object.assign(settings, s, { network: { ...s.network } }), { immediate: true })
const settingsSaved = ref(false)
const settingsError = ref('')
async function saveSettings() {
  settingsError.value = ''
  const check = adSettingsSchema.safeParse(settings)
  if (!check.success) {
    const issue = check.error.issues[0]
    settingsError.value = issue?.path[0] === 'network' ? issue.message : 'Valori tra 0 e 200'
    return
  }
  try {
    await $fetch('/api/admin/ad-settings', { method: 'PUT', body: check.data })
    await refresh()
    settingsSaved.value = true
    setTimeout(() => (settingsSaved.value = false), 2000)
  }
  catch (e) {
    settingsError.value = errorMessage(e)
  }
}

// --- Campagne ---
const STATUS = {
  live: { label: 'In onda', cls: 'live' },
  paused: { label: 'In pausa', cls: 'paused' },
  scheduled: { label: 'Programmata', cls: 'scheduled' },
  ended: { label: 'Finita', cls: 'ended' },
  exhausted: { label: 'Tetto raggiunto', cls: 'ended' },
} as const
// Un clic può arrivare senza visualizzazione (link aperto a mano): il rapporto si ferma al 100%
const pct = (a: number, b: number) => (b ? `${(Math.min(1, a / b) * 100).toFixed(1).replace('.', ',')}%` : '—')
const fmt = (n: number) => n.toLocaleString('it-IT')

const totals = computed(() => {
  const list = data.value?.ads ?? []
  return {
    live: list.filter(a => a.status === 'live').length,
    views: list.reduce((s, a) => s + a.views, 0),
    clicks: list.reduce((s, a) => s + a.clicks, 0),
    valueCents: list.reduce((s, a) => s + a.valueCents, 0),
    priced: list.some(a => a.deal.priceType !== 'none'),
  }
})

async function toggleActive(ad: AdminAd) {
  await $fetch(`/api/admin/ads/${ad.id}`, { method: 'PATCH', body: { active: !ad.active } })
  await refresh()
}
const confirmDelete = ref<number | null>(null)
async function remove(ad: AdminAd) {
  if (confirmDelete.value !== ad.id) {
    confirmDelete.value = ad.id
    return
  }
  await $fetch(`/api/admin/ads/${ad.id}`, { method: 'DELETE' })
  confirmDelete.value = null
  if (editing.value === ad.id) closeForm()
  await refresh()
}

// --- Modulo (nuova o modifica) con anteprima dal vivo ---
// Copie profonde: modificare il modulo non deve toccare i dati dell'elenco
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const blank = () => ({
  name: '', advertiser: '', title: '', body: '', cta: 'Scopri di più', url: 'https://', weight: 1, active: true,
  startDate: null as string | null, endDate: null as string | null,
  targeting: clone(AD_TARGETING_DEFAULT), deal: clone(AD_DEAL_DEFAULT),
  defaultLang: 'it' as AdLang, translations: {} as AdTranslations,
})
const form = reactive(blank())
const editing = ref<number | 'new' | null>(null)
const file = ref<File | null>(null)
const filePreview = ref<string | null>(null)
// Immagine già salvata: l'originale, così si può ritagliare di nuovo senza ricaricarla
const keptImage = ref<string | null>(null)
const keptCrop = ref<AdCrop | null>(null)
const crop = ref<AdCrop | null>(null)
const imageSrc = computed(() => filePreview.value ?? keptImage.value)
const formError = ref('')
const sending = ref(false)

function openForm(ad?: AdminAd) {
  Object.assign(form, blank(), ad ? { ...ad, targeting: clone(ad.targeting), deal: clone(ad.deal), translations: clone(ad.translations) } : {})
  editing.value = ad ? ad.id : 'new'
  activeLang.value = form.defaultLang
  keptImage.value = ad?.imageSource ?? ad?.image ?? null
  keptCrop.value = ad?.imageCrop ?? null
  setFile(null)
  formError.value = ''
  // Il modulo prende il posto dell'elenco: si riparte dall'alto
  window.scrollTo({ top: 0 })
}
function closeForm() {
  editing.value = null
  setFile(null)
}
function setFile(f: File | null) {
  if (filePreview.value) URL.revokeObjectURL(filePreview.value)
  file.value = f
  filePreview.value = f ? URL.createObjectURL(f) : null
}
// --- Testi nelle lingue del sito: titolo, descrizione e pulsante qui sopra sono della lingua predefinita ---
const activeLang = ref<AdLang>('it')
const emptyText = () => ({ title: '', body: '', cta: '', url: '' })
function openLang(lang: AdLang) {
  if (lang !== form.defaultLang) form.translations[lang] ??= emptyText()
  activeLang.value = lang
}
// Campi della scheda aperta: il modulo stesso per la predefinita, la traduzione per le altre
const cur = computed(() => (activeLang.value === form.defaultLang ? form : form.translations[activeLang.value] ?? emptyText()))
type LangState = 'default' | 'done' | 'partial' | 'empty'
function langState(lang: AdLang): LangState {
  if (lang === form.defaultLang) return 'default'
  const t = form.translations[lang]
  if (isTranslated(t)) return 'done'
  return t && (t.title || t.body || t.cta || t.url) ? 'partial' : 'empty'
}
// Nuova lingua predefinita: i testi restano nella loro lingua, cambia solo quale si usa come riserva
function setDefault(lang: AdLang) {
  const old = form.defaultLang
  if (lang === old) return
  const next = form.translations[lang] ?? emptyText()
  // Se la nuova predefinita aveva un link suo diventa quello generale, e il vecchio resta alla vecchia lingua
  form.translations[old] = { title: form.title, body: form.body, cta: form.cta, url: next.url ? form.url : '' }
  Object.assign(form, { title: next.title, body: next.body, cta: next.cta, url: next.url || form.url })
  Reflect.deleteProperty(form.translations, lang)
  form.defaultLang = lang
  activeLang.value = lang
}
function copyFromDefault() {
  const t = form.translations[activeLang.value]
  if (t) Object.assign(t, { title: form.title, body: form.body, cta: form.cta })
}
const shown = computed(() => adTextFor(form, activeLang.value))
const preview = computed(() => ({
  id: 0, advertiser: form.advertiser, title: shown.value.title || 'Titolo dell\'annuncio', body: shown.value.body,
  cta: shown.value.cta || 'Scopri di più', image: imageSrc.value, href: '#',
}))
// Lingue in cui la campagna ha un testo suo (la predefinita per prima)
const adLangs = (ad: AdminAd) => [ad.defaultLang, ...AD_LANGS.filter(l => l !== ad.defaultLang && isTranslated(ad.translations[l]))]

async function submit() {
  formError.value = ''
  const check = adFieldsSchema.safeParse({ ...form, startDate: form.startDate || null, endDate: form.endDate || null })
  if (!check.success) {
    formError.value = check.error.issues[0]?.message ?? 'Controlla i campi'
    return
  }
  const fd = new FormData()
  for (const [k, v] of Object.entries(check.data)) fd.append(k, v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
  if (file.value) fd.append('image', file.value)
  else if (editing.value !== 'new' && !keptImage.value) fd.append('removeImage', 'true')
  if (imageSrc.value && crop.value) fd.append('crop', JSON.stringify(crop.value))
  sending.value = true
  try {
    await $fetch(editing.value === 'new' ? '/api/admin/ads' : `/api/admin/ads/${editing.value}`, { method: 'POST', body: fd })
    closeForm()
    await refresh()
  }
  catch (e) {
    formError.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}

const expanded = ref<number | null>(null)
// Qualche campagna usa zone in km: servono le coordinate di chi vota
const needsCoords = computed(() => data.value?.ads.some(a => a.targeting.places.length) ?? false)

// --- Google AdSense ---
const NETWORK_MODES = [
  { value: 'off', label: 'Spento', hint: 'Solo le tue campagne.' },
  { value: 'fallback', label: 'Quando non hai campagne in onda', hint: 'Lo spazio non resta mai vuoto: Google riempie i buchi.' },
  { value: 'mix', label: 'Insieme alle tue campagne', hint: 'Google entra nel sorteggio come una campagna, con il suo peso.' },
] as const
const networkSeries = computed(() => data.value?.network.days.map(d => ({ day: d.day, value: d.views })) ?? [])
</script>

<template>
  <section class="admin-page ad-admin">
    <!-- Modulo a pagina intera: sezioni a sinistra, anteprima che resta in vista a destra -->
    <form v-if="editing !== null" class="ad-admin__edit" novalidate @submit.prevent="submit">
      <header class="ad-admin__edit-head">
        <button type="button" class="btn btn--link ad-admin__back" @click="closeForm">← Campagne</button>
        <h1 class="admin-page__title">{{ editing === 'new' ? 'Nuova campagna' : form.name || 'Modifica campagna' }}</h1>
      </header>

      <div class="ad-admin__layout">
        <div class="ad-admin__sections">
          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">1 · Immagine</legend>
            <AdImageEditor v-if="imageSrc" :key="imageSrc" v-model="crop" :src="imageSrc" :initial="filePreview ? null : keptCrop" />
            <div class="ad-admin__file">
              <label class="ad-admin__pick">
                {{ imageSrc ? 'Cambia immagine' : 'Scegli un\'immagine' }}
                <input type="file" accept="image/*" class="u-visually-hidden" @change="setFile(($event.target as HTMLInputElement).files?.[0] ?? null)">
              </label>
              <button v-if="imageSrc" type="button" class="btn btn--ghost" @click="setFile(null); keptImage = null">Togli</button>
              <small v-if="!imageSrc" class="admin-form__hint">Facoltativa. JPG, PNG o WebP fino a 5 MB.</small>
            </div>
          </fieldset>

          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">2 · Testo dell'annuncio</legend>
            <div class="ad-admin__langs" role="tablist" aria-label="Lingua del testo">
              <button
                v-for="l in AD_LANGS" :key="l" type="button" role="tab" class="ad-admin__lang" :class="[`ad-admin__lang--${langState(l)}`, { 'is-active': activeLang === l }]"
                :aria-selected="activeLang === l" @click="openLang(l)"
              >
                {{ LANG_NAMES[l] }}
                <small class="ad-admin__lang-state">{{ { default: '★ predefinita', done: '✓ tradotta', partial: '! incompleta', empty: `usa ${l === form.defaultLang ? '' : form.defaultLang.toUpperCase()}` }[langState(l)] }}</small>
              </button>
            </div>
            <label class="ad-admin__default-lang">Lingua predefinita
              <select :value="form.defaultLang" @change="setDefault(($event.target as HTMLSelectElement).value as AdLang)">
                <option v-for="l in AD_LANGS" :key="l" :value="l">{{ LANG_NAMES[l] }}</option>
              </select>
            </label>
            <small class="admin-form__hint ad-admin__note">Chi usa il sito in una lingua senza testo vede quello della predefinita. Cambiandola i testi restano nella loro lingua.</small>

            <div class="ad-admin__lang-panel">
              <p v-if="activeLang !== form.defaultLang && langState(activeLang) !== 'done'" class="ad-admin__lang-hint">
                Finché mancano titolo e pulsante, chi usa il sito in {{ LANG_NAMES[activeLang] }} vede il testo in {{ LANG_NAMES[form.defaultLang] }}.
                <button type="button" class="ad-admin__link" @click="copyFromDefault">Parti dal testo in {{ LANG_NAMES[form.defaultLang] }}</button>
              </p>
              <label>Titolo<input v-model="cur.title" maxlength="60" :placeholder="activeLang === form.defaultLang ? '-20% sulle crocchette' : form.title"></label>
              <label>Descrizione <em>facoltativa</em><textarea v-model="cur.body" maxlength="160" rows="2" :placeholder="activeLang === form.defaultLang ? 'Solo questa settimana, con consegna gratuita' : form.body" /></label>
              <label>Testo del pulsante<input v-model="cur.cta" maxlength="24" :placeholder="activeLang === form.defaultLang ? '' : form.cta"></label>
              <label v-if="activeLang !== form.defaultLang">Link per chi usa il sito in {{ LANG_NAMES[activeLang] }} <em>facoltativo, se no quello della sezione 3</em>
                <input v-model="(cur as { url: string }).url" type="url" maxlength="500" placeholder="https://">
              </label>
            </div>
            <label>Inserzionista <em>facoltativo, uguale in tutte le lingue</em><input v-model="form.advertiser" maxlength="60" placeholder="Pet shop Rossi"></label>
          </fieldset>

          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">3 · Dove porta</legend>
            <label>Link<input v-model="form.url" type="url" maxlength="500" placeholder="https://"></label>
            <small class="admin-form__hint ad-admin__note">Aggiungiamo noi utm_source=petduel: l'inserzionista vede nelle sue statistiche le visite e gli acquisti arrivati da qui.</small>
          </fieldset>

          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">4 · Programmazione</legend>
            <label>Nome della campagna<input v-model="form.name" maxlength="60" placeholder="Crocchette novembre"></label>
            <small class="admin-form__hint ad-admin__note">Lo vedi solo tu, nell'elenco e nelle statistiche.</small>
            <div class="admin-form__grid">
              <label>Dal <em>facoltativo</em><input v-model="form.startDate" type="date"></label>
              <label>Al, incluso <em>facoltativo</em><input v-model="form.endDate" type="date"></label>
            </div>
            <label>Frequenza rispetto alle altre campagne
              <select v-model.number="form.weight">
                <option v-for="w in 10" :key="w" :value="w">{{ w === 1 ? 'Normale' : `${w} volte più spesso` }}</option>
              </select>
            </label>
            <AdScheduleFields v-model="form.targeting" />
            <label class="admin-form__check"><input v-model="form.active" type="checkbox"> In onda appena salvi</label>
          </fieldset>

          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">5 · Chi la vede</legend>
            <AdAudienceFields v-model="form.targeting" />
          </fieldset>

          <fieldset class="admin-form admin-form--tight ad-admin__box">
            <legend class="ad-admin__legend">6 · Accordo e budget <em class="ad-admin__legend-note">solo per te</em></legend>
            <AdDealFields v-model="form.deal" />
          </fieldset>
        </div>

        <aside class="ad-admin__preview">
          <p class="ad-admin__preview-label">Anteprima in {{ LANG_NAMES[activeLang] }}<template v-if="shown.lang !== activeLang"> · mostra il testo in {{ LANG_NAMES[shown.lang] }}</template></p>
          <AdCard :ad="preview" :crop="crop" preview class="ad-admin__preview-card" />
          <div class="ad-admin__reach">
            <b class="ad-admin__reach-title">Chi la vede</b>
            <ul class="ad-admin__reach-list"><li v-for="s in audienceSummary(form.targeting, form.deal)" :key="s">{{ s }}</li></ul>
          </div>
        </aside>
      </div>

      <div class="ad-admin__save">
        <p v-if="formError" class="error ad-admin__save-error" role="alert">{{ formError }}</p>
        <button type="button" class="btn btn--ghost" @click="closeForm">Annulla</button>
        <button type="submit" class="btn btn--primary btn--lg" :disabled="sending">{{ sending ? 'Salvataggio…' : 'Salva campagna' }}</button>
      </div>
    </form>

    <template v-else>
      <header class="admin-page__header">
        <h1 class="admin-page__title">Pubblicità</h1>
        <button type="button" class="btn btn--primary btn--lg" @click="openForm()">+ Nuova campagna</button>
      </header>
      <p v-if="loadError" class="error" role="alert">Non riesco a caricare le campagne</p>

      <div v-if="data" class="ad-admin__tiles">
        <div class="ad-admin__tile"><span class="ad-admin__tile-label">In onda</span><b class="ad-admin__tile-value">{{ totals.live }}</b></div>
        <div class="ad-admin__tile"><span class="ad-admin__tile-label">Visualizzazioni</span><b class="ad-admin__tile-value">{{ fmt(totals.views) }}</b></div>
        <div class="ad-admin__tile"><span class="ad-admin__tile-label">Clic</span><b class="ad-admin__tile-value">{{ fmt(totals.clicks) }}</b></div>
        <div class="ad-admin__tile"><span class="ad-admin__tile-label">CTR medio</span><b class="ad-admin__tile-value">{{ pct(totals.clicks, totals.views) }}</b></div>
        <div v-if="totals.priced" class="ad-admin__tile"><span class="ad-admin__tile-label">Valore maturato</span><b class="ad-admin__tile-value">{{ formatEuro(totals.valueCents) }}</b></div>
      </div>

      <p v-if="data" class="ad-admin__you" :class="{ 'ad-admin__you--warn': !data.you.country || (needsCoords && !data.you.hasCoords) }">
        <template v-if="data.you.country">
          Il sito ti vede da <b>{{ flag(data.you.country) }} {{ data.you.city ? `${data.you.city}, ` : '' }}{{ countryName(data.you.country) }}</b><template v-if="data.you.lang">, lingua <b>{{ LANG_NAMES[data.you.lang] }}</b></template>.
          <template v-if="data.you.simulated"> Posizione finta dello sviluppo in locale: per provarne un'altra imposta NUXT_DEV_GEO nel file .env.</template>
          <template v-else-if="needsCoords && !data.you.hasCoords"> Arriva solo il paese, non la città: le campagne con zone in km non escono. Su Cloudflare attiva «Add visitor location headers».</template>
        </template>
        <template v-else>Il sito non riceve la tua posizione: le campagne limitate a paesi o zone non ti compaiono (a meno di «Mostrala anche a chi non sappiamo dove si trova»).</template>
      </p>

      <h2 class="admin-page__heading">Campagne</h2>
      <p v-if="data && !data.ads.length" class="admin-page__empty">Nessuna campagna. Creane una: comparirà tra un duello e l'altro.</p>
      <ul class="ad-admin__ads">
        <li v-for="ad in data?.ads" :key="ad.id" class="ad-admin__ad">
          <div class="ad-admin__ad-head">
            <img v-if="ad.image" :src="ad.image" alt="" class="ad-admin__thumb">
            <span v-else class="ad-admin__thumb ad-admin__thumb--empty" aria-hidden="true">📣</span>
            <div class="ad-admin__who">
              <b class="ad-admin__ad-name">{{ ad.name }}</b>
              <small class="ad-admin__ad-meta">{{ ad.advertiser || 'Senza inserzionista' }}<template v-if="ad.weight > 1"> · {{ ad.weight }}× più spesso</template><template v-if="ad.startDate || ad.endDate"> · {{ ad.startDate ? shortDate(ad.startDate) : '…' }} → {{ ad.endDate ? shortDate(ad.endDate) : '…' }}</template></small>
            </div>
            <span class="ad-admin__status" :class="`ad-admin__status--${STATUS[ad.status].cls}`">{{ STATUS[ad.status].label }}</span>
          </div>
          <p class="ad-admin__reach-line">
            <span class="ad-admin__fact" :title="`Testo in: ${adLangs(ad).map(l => LANG_NAMES[l]).join(', ')}`">🌐 <template v-for="(l, i) in adLangs(ad)" :key="l">{{ i ? ' · ' : '' }}{{ l.toUpperCase() }}{{ i ? '' : '★' }}</template></span>
            <span v-for="s in audienceSummary(ad.targeting, ad.deal)" :key="s" class="ad-admin__fact">{{ s }}</span>
            <span v-if="ad.deal.priceType !== 'none'" class="ad-admin__fact ad-admin__fact--money">{{ formatEuro(ad.valueCents) }} maturati</span>
            <span v-if="ad.deal.maxViews" class="ad-admin__fact ad-admin__fact--cap">{{ fmt(ad.views) }} / {{ fmt(ad.deal.maxViews) }} viste</span>
            <span v-if="ad.deal.maxClicks" class="ad-admin__fact ad-admin__fact--cap">{{ fmt(ad.clicks) }} / {{ fmt(ad.deal.maxClicks) }} clic</span>
          </p>
          <dl class="ad-admin__stats">
            <div class="ad-admin__stat"><dt>Visualizzazioni</dt><dd>{{ fmt(ad.views) }}</dd><small>{{ fmt(ad.uniqueViews) }} persone</small></div>
            <div class="ad-admin__stat"><dt>Clic</dt><dd>{{ fmt(ad.clicks) }}</dd><small>{{ fmt(ad.uniqueClicks) }} persone</small></div>
            <div class="ad-admin__stat"><dt>CTR</dt><dd>{{ pct(ad.clicks, ad.views) }}</dd><small>clic / visualizzazioni</small></div>
            <div class="ad-admin__stat"><dt>Conversione</dt><dd>{{ pct(ad.uniqueClicks, ad.uniqueViews) }}</dd><small>persone che cliccano</small></div>
          </dl>
          <AdInsights v-if="expanded === ad.id" :ad="ad" />
          <div class="ad-admin__acts">
            <button type="button" class="btn btn--sm ad-admin__act--main" @click="openForm(ad)">Modifica</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="toggleActive(ad)">{{ ad.active ? 'Metti in pausa' : 'Rimetti in onda' }}</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="expanded = expanded === ad.id ? null : ad.id">{{ expanded === ad.id ? 'Nascondi dettagli' : 'Dettagli e statistiche' }}</button>
            <button type="button" class="btn btn--danger btn--sm ad-admin__act--danger" @click="remove(ad)">{{ confirmDelete === ad.id ? 'Sicuro? Elimina con le statistiche' : 'Elimina' }}</button>
          </div>
        </li>
      </ul>

      <h2 class="admin-page__heading">Quando compaiono</h2>
      <form class="admin-form admin-form--tight ad-admin__box ad-admin__freq" @submit.prevent="saveSettings">
        <p class="ad-admin__sentence">
          Una pubblicità ogni
          <input v-model.number="settings.every" type="number" min="0" max="200" aria-label="Ogni quanti voti" class="ad-admin__sentence-input">
          voti, dopo i primi
          <input v-model.number="settings.startAfter" type="number" min="0" max="200" aria-label="Voti senza pubblicità all'inizio" class="ad-admin__sentence-input">
          di ogni visita.
        </p>
        <label class="admin-form__check"><input v-model="settings.inChallenges" type="checkbox"> Anche nei duelli delle sfide</label>
        <p class="hint">Con 0 le pubblicità sono spente, anche quelle di Google.</p>

        <fieldset class="ad-admin__network">
          <legend class="ad-admin__legend">Google AdSense</legend>
          <div class="ad-admin__modes" role="radiogroup" aria-label="Quando usare Google">
            <label v-for="m in NETWORK_MODES" :key="m.value" class="ad-admin__mode" :class="{ 'is-active': settings.network.mode === m.value }">
              <input v-model="settings.network.mode" type="radio" name="network-mode" :value="m.value" class="ad-admin__mode-input">
              <b>{{ m.label }}</b>
              <small class="ad-admin__mode-hint">{{ m.hint }}</small>
            </label>
          </div>
          <template v-if="settings.network.mode !== 'off'">
            <div class="admin-form__grid">
              <label>Codice editore <em>dal pannello AdSense, Account → Informazioni</em>
                <input v-model.trim="settings.network.client" placeholder="ca-pub-1234567890123456" autocomplete="off" spellcheck="false">
              </label>
              <label>ID unità pubblicitaria <em>Annunci → Per unità pubblicitaria</em>
                <input v-model.trim="settings.network.slot" placeholder="1234567890" inputmode="numeric" autocomplete="off">
              </label>
            </div>
            <label v-if="settings.network.mode === 'mix'" class="ad-admin__weight">Peso nel sorteggio <em>come quello delle campagne: 2 = esce il doppio di una campagna con peso 1</em>
              <input v-model.number="settings.network.weight" type="number" min="1" max="10">
            </label>
            <ul class="ad-admin__todo">
              <li>Il sito deve essere online e approvato da Google: finché non lo è, i riquadri restano vuoti e si salta avanti da soli.</li>
              <li>Attiva il messaggio di consenso di Google in AdSense → <b>Privacy e messaggi</b> → GDPR: in Europa è obbligatorio.</li>
              <li>Il file <a href="/ads.txt" target="_blank" class="ad-admin__link">ads.txt</a> si aggiorna da solo con il codice editore dopo il salvataggio.</li>
            </ul>
          </template>
          <div v-if="data?.network.views" class="ad-admin__netstats">
            <dl class="ad-admin__stats ad-admin__stats--single">
              <div class="ad-admin__stat"><dt>Riquadri mostrati</dt><dd>{{ fmt(data.network.views) }}</dd><small>{{ fmt(data.network.uniqueViews) }} persone</small></div>
            </dl>
            <AdminBars title="Riquadri Google, 14 giorni" :days="networkSeries" class="admin-bars--flat" />
            <p class="hint">Clic e guadagni li conta Google: li trovi nel pannello AdSense.</p>
          </div>
        </fieldset>
        <p v-if="settingsError" class="error" role="alert">{{ settingsError }}</p>
        <button type="submit" class="btn btn--primary btn--lg">{{ settingsSaved ? 'Salvato ✓' : 'Salva' }}</button>
      </form>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: campagne pubblicitarie, modulo di modifica e impostazioni della rete
.ad-admin {
  // Vale anche per i fieldset: niente bordo e margini del browser
  &__box { @include card(16px, 22px); border: 0; margin: 0; min-width: 0; }

  // Modulo
  &__edit { @include stack($space-6); }

  &__edit-head { @include stack(2px); align-items: flex-start; }

  &__back { padding: 4px 0; }

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: $space-6;

    @media (min-width: 1000px) { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; }
  }

  &__sections { @include stack($space-5); min-width: 0; }

  // La legenda si comporta come un titolo dentro la scheda
  &__legend {
    float: left;
    width: 100%;
    padding: 0;
    margin-bottom: $space-1;
    font-family: var(--display);
    font-weight: 600;
    font-size: 18px;

    + * { clear: both; }
  }

  &__legend-note { font-style: normal; font-size: 13px; font-family: var(--body); font-weight: 700; color: var(--muted); }

  &__note { margin-top: -4px; }

  &__file { @include cluster($space-3); align-items: center; }

  &__pick {
    flex-direction: row;
    cursor: pointer;
    background: var(--ink);
    color: var(--bg);
    @include pill(10px, 16px);
    font-weight: 800;
    font-size: 14px;

    &:has(input:focus-visible) { outline: 2px solid var(--coral); outline-offset: 2px; }
  }

  &__langs { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: $space-2; }

  &__lang {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border-radius: $radius-sm;
    cursor: pointer;
    border: 2px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font-weight: 800;
    font-size: 13px;
    text-align: left;

    &.is-active { border-color: var(--coral); background: color-mix(in srgb, var(--coral) 12%, var(--bg)); }
  }

  &__lang-state {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);

    .ad-admin__lang--done & { color: var(--mint); }

    .ad-admin__lang--partial & { color: var(--coral-deep); }
  }

  &__default-lang { max-width: 260px; }

  &__lang-panel { @include stack($space-4); padding: 12px; border-radius: 16px; background: color-mix(in srgb, var(--coral) 6%, var(--surface)); }

  &__lang-hint { margin: 0; font-size: 13px; color: var(--muted); }

  &__link { border: 0; background: none; padding: 0; color: var(--coral-deep); font-weight: 800; cursor: pointer; font-size: 13px; text-decoration: underline; }

  &__preview {
    @include stack($space-2);
    min-width: 0;

    @media (min-width: 1000px) { position: sticky; top: 12px; }
  }

  &__preview-label { margin: 0; font-size: 12px; font-weight: 800; color: var(--muted); }

  // Altezza di un duello su telefono: si vede quanto spazio prende davvero l'immagine
  &__preview-card { height: 560px; flex: none; width: 100%; max-width: 380px; align-self: center; border: 2px dashed var(--line); }

  &__reach { background: var(--surface); border-radius: $radius-md; padding: 12px 14px; max-width: 380px; width: 100%; align-self: center; font-size: 13px; }

  &__reach-title { font-size: 12px; color: var(--muted); }

  &__reach-list { margin: 6px 0 0; padding-left: 18px; @include stack(2px); font-weight: 700; }

  // Pulsanti finali sempre a portata, anche a modulo lungo
  &__save {
    position: sticky;
    bottom: 12px;
    z-index: 6;
    align-self: flex-end;
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: $space-3;
    background: var(--surface);
    border-radius: $radius-pill;
    padding: $space-3;
    box-shadow: 0 10px 30px -10px var(--shadow);

    @include mq-down(md) { bottom: 92px; }
  }

  &__save-error { margin-right: auto; padding-left: 10px; }

  // Elenco
  &__tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: $space-3;

    @media (max-width: 560px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  &__tile { @include card(10px 12px, $radius-md); display: flex; flex-direction: column; }

  &__tile-label { font-size: 12px; font-weight: 800; color: var(--muted); }

  &__tile-value { font-family: var(--display); font-size: 24px; font-variant-numeric: tabular-nums; }

  &__you {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    background: var(--surface);
    border-radius: $radius-sm;
    padding: 10px 14px;

    b { color: var(--ink); }

    &--warn { color: var(--ink); background: color-mix(in srgb, var(--sun) 30%, var(--surface)); }
  }

  &__ads { list-style: none; margin: 0; padding: 0; @include stack($space-4); }

  &__ad { @include card(14px, 22px); @include stack($space-5); }

  &__ad-head { display: flex; align-items: center; gap: $space-5; }

  &__thumb {
    width: 64px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--bg);

    &--empty { display: grid; place-items: center; font-size: 22px; }
  }

  &__who { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  &__ad-name { font-size: 16px; }

  &__ad-meta { color: var(--muted); font-size: 12px; font-weight: 700; }

  &__status {
    font-size: 12px;
    font-weight: 800;
    @include pill(3px, 10px);
    flex-shrink: 0;

    &--live {
      background: color-mix(in srgb, var(--mint) 20%, transparent);
      color: var(--mint);

      &::before { content: "● "; }
    }

    &--paused { background: var(--bg); color: var(--muted); }

    &--scheduled { background: color-mix(in srgb, var(--sun) 30%, transparent); color: var(--ink); }

    &--ended { background: var(--bg); color: var(--muted); text-decoration: line-through; }
  }

  &__reach-line { margin: -4px 0 0; display: flex; flex-wrap: wrap; gap: 4px 6px; font-size: 12px; font-weight: 700; }

  &__fact {
    background: var(--bg);
    @include pill(3px, 10px);
    color: var(--muted);

    &--money { color: var(--mint); background: color-mix(in srgb, var(--mint) 14%, transparent); }

    &--cap { color: var(--ink); }
  }

  &__stats {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-3;

    @media (max-width: 560px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    &--single { grid-template-columns: minmax(0, 220px); }
  }

  &__stat {
    background: var(--bg);
    border-radius: $radius-sm;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;

    dt { font-size: 11px; font-weight: 800; color: var(--muted); }

    dd { margin: 0; font-family: var(--display); font-size: 20px; font-variant-numeric: tabular-nums; }

    small { font-size: 11px; color: var(--muted); }
  }

  &__acts { @include cluster($space-2); }

  &__act--main { background: var(--ink); color: var(--bg); }

  &__act--danger { margin-left: auto; }

  // Impostazioni
  &__freq { align-items: flex-start; }

  &__sentence {
    margin: 0;
    font-weight: 800;
    line-height: 2.4;

    // Specificità più alta dei campi di .admin-form
    .ad-admin__sentence-input { width: 72px; display: inline-block; text-align: center; padding: 6px; margin: 0 4px; font-weight: 800; }
  }

  &__network { width: 100%; margin: $space-1 0 0; padding: 14px 0 0; border: 0; border-top: 2px solid var(--line); @include stack($space-4); min-width: 0; }

  &__modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: $space-3; }

  &__mode {
    position: relative;
    cursor: pointer;
    background: var(--bg);
    border: 2px solid var(--line);
    border-radius: 16px;
    padding: 10px 12px;
    gap: 2px;

    &.is-active { border-color: var(--coral); }

    &:has(input:focus-visible) { outline: 2px solid var(--coral); outline-offset: 2px; }
  }

  &__mode-input { position: absolute; opacity: 0; pointer-events: none; }

  &__mode-hint { font-weight: 600; color: var(--muted); font-size: 12px; }

  &__weight input { max-width: 120px; }

  &__todo { margin: 0; padding-left: 18px; font-size: 13px; color: var(--muted); @include stack($space-1); }

  &__netstats { display: grid; grid-template-columns: minmax(0, 1fr); gap: $space-3; }
}
</style>
