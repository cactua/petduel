<script setup lang="ts">
import { SPECIES, TRANSLATED_LOCALES, challengeFieldsSchema, type AdminChallenge, type ChallengeFields, type ChallengeSummary } from '#shared/models'
import { LANGUAGES } from '../../../i18n/languages'
import { speciesName } from '#shared/speciesNames'

/**
 * Modulo di una sfida nel pannello admin (nuova o da modificare), con l'anteprima di come la vedranno i giocatori.
 * Controlla i campi con lo stesso schema del server e porta al primo campo da sistemare; il salvataggio lo fa la pagina
 */
const props = defineProps<{
  initial: ChallengeFields
  // Le altre sfide, per avvisare se si sovrappongono
  others?: AdminChallenge[]
  selfId?: number
  // Data bloccata (sfida iniziata), pubblico bloccato (ci sono partecipanti)
  lockDate?: boolean
  lockAudience?: boolean
  saving?: boolean
  error?: string
  submitLabel: string
}>()
const emit = defineEmits<{ save: [fields: ChallengeFields], cancel: [], dirty: [value: boolean] }>()

const { features } = useAppConfig()
const clone = (f: ChallengeFields): ChallengeFields => JSON.parse(JSON.stringify({
  ...f,
  translations: Object.fromEntries(TRANSLATED_LOCALES.map(c => [c, f.translations[c] ?? { title: '', description: '' }])),
}))
const form = reactive<ChallengeFields>(clone(props.initial))
watch(() => props.initial, v => Object.assign(form, clone(v)))
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(clone(props.initial)))
watch(dirty, v => emit('dirty', v), { immediate: true })

// ── Emoji: si scrive o si sceglie tra le più usate ──
const EMOJIS = ['🏆', '🎨', '💖', '🔥', '⭐', '🌈', '🎉', '😴', '👅', '🎃', '🎄', '❄️', '🌸', '☀️', '🍂', '🐾']

// ── Lingue: una scheda per ognuna, con il segno di quelle complete ──
const otherLanguages = LANGUAGES.filter(l => (TRANSLATED_LOCALES as string[]).includes(l.code))
const activeLang = ref(otherLanguages[0]?.code ?? '')
const complete = (code: string) => {
  const t = form.translations[code]
  return !!t && t.title.trim().length >= 3 && t.description.trim().length >= 3
}
const missing = computed(() => otherLanguages.filter(l => !complete(l.code)).length)
function onTabKey(e: KeyboardEvent) {
  const i = otherLanguages.findIndex(l => l.code === activeLang.value)
  const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? otherLanguages.length - 1 : null
  if (next === null) return
  e.preventDefault()
  activeLang.value = otherLanguages[(next + otherLanguages.length) % otherLanguages.length]!.code
  nextTick(() => document.getElementById(`c-tab-${activeLang.value}`)?.focus())
}

// ── Date: la sfida dura 7 giorni da mezzanotte (ora italiana) del giorno scelto ──
const day = (iso: string) => new Date(`${iso}T00:00:00`)
const isoDay = (d: Date) => d.toLocaleDateString('sv-SE')
const addDays = (iso: string, n: number) => {
  const d = day(iso)
  d.setDate(d.getDate() + n)
  return isoDay(d)
}
const nextMonday = (weeks = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + weeks * 7)
  return isoDay(d)
}
const quickDates = [
  { label: 'Lunedì prossimo', value: nextMonday() },
  { label: 'Tra due settimane', value: nextMonday(1) },
  { label: 'Tra tre settimane', value: nextMonday(2) },
]
const longDate = (iso: string) => day(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const validDate = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(form.startDate) && !Number.isNaN(day(form.startDate).getTime()))
const range = computed(() => (validDate.value ? `Da ${longDate(form.startDate)} a ${longDate(addDays(form.startDate, 7))}, a mezzanotte` : ''))
const notMonday = computed(() => validDate.value && day(form.startDate).getDay() !== 1)
const inPast = computed(() => !props.lockDate && validDate.value && day(addDays(form.startDate, 7)) <= new Date())
// Altre sfide nella stessa settimana: si giocano in parallelo, va bene ma è meglio saperlo
const overlapping = computed(() => {
  if (!validDate.value) return []
  const start = day(form.startDate).getTime()
  const end = day(addDays(form.startDate, 7)).getTime()
  return (props.others ?? []).filter(c => c.id !== props.selfId && new Date(c.startsAt).getTime() < end && new Date(c.endsAt).getTime() > start)
})

// ── Anteprima: la card come la vedranno i giocatori ──
const preview = computed<ChallengeSummary>(() => ({
  id: -1,
  slug: 'anteprima',
  title: form.title || 'Titolo della sfida',
  description: form.description || 'La descrizione dice cosa deve mostrare l\'immagine.',
  emoji: form.emoji || '🏆',
  species: form.species,
  adoptionOnly: form.adoptionOnly,
  translations: {},
  startsAt: validDate.value ? day(form.startDate).toISOString() : new Date().toISOString(),
  endsAt: validDate.value ? day(addDays(form.startDate, 7)).toISOString() : new Date().toISOString(),
  // Già iniziata: l'anteprima la mostra in corso, come la vedono adesso i giocatori
  status: validDate.value && day(form.startDate) <= new Date() ? 'active' : 'upcoming',
  entries: 0,
  winner: null,
  leaders: [],
}))

// ── Controllo: errori accanto ai campi e si va al primo ──
const errors = ref<Record<string, string>>({})
const fieldId = (path: string) => {
  const [a, lang, field] = path.split('.')
  if (a === 'translations') return `c-${field === 'description' ? 'desc' : 'title'}-${lang}`
  return ({ title: 'c-title', description: 'c-desc', emoji: 'c-emoji', startDate: 'c-start' } as Record<string, string>)[a!] ?? ''
}
function submit() {
  const check = challengeFieldsSchema.safeParse(form)
  if (!check.success) {
    errors.value = Object.fromEntries(check.error.issues.map(i => [i.path.join('.'), i.message]))
    const first = check.error.issues[0]!.path.join('.')
    if (first.startsWith('translations.')) activeLang.value = first.split('.')[1]!
    nextTick(() => document.getElementById(fieldId(first))?.focus())
    return
  }
  errors.value = {}
  emit('save', check.data)
}
// Dopo un invio con errori, i messaggi si aggiornano mentre si correggono i campi
watch(form, () => {
  if (!Object.keys(errors.value).length) return
  const check = challengeFieldsSchema.safeParse(form)
  errors.value = check.success ? {} : Object.fromEntries(check.error.issues.map(i => [i.path.join('.'), i.message]))
}, { deep: true })
const err = (path: string) => errors.value[path]
const count = (v: string, max: number) => `${v.length}/${max}`
</script>

<template>
  <form class="challenge-form" novalidate @submit.prevent="submit">
    <div class="challenge-form__main">
      <!-- 1. Il tema -->
      <section class="challenge-form__section" aria-labelledby="cf-theme">
        <h2 id="cf-theme" class="challenge-form__heading"><span class="challenge-form__num" aria-hidden="true">1</span> Il tema</h2>
        <div class="challenge-form__theme">
          <div class="challenge-form__field challenge-form__field--emoji">
            <label for="c-emoji" class="label">Emoji</label>
            <input
              id="c-emoji" v-model="form.emoji" maxlength="16" placeholder="🏆" class="input challenge-form__emoji-input"
              :aria-invalid="!!err('emoji')" :aria-describedby="err('emoji') ? 'c-emoji-err' : undefined"
            >
          </div>
          <div class="challenge-form__field challenge-form__grow">
            <label for="c-title" class="label">Titolo in italiano</label>
            <input
              id="c-title" v-model="form.title" maxlength="60" placeholder="Il travestimento più bello" class="input"
              :aria-invalid="!!err('title')" :aria-describedby="`c-title-count${err('title') ? ' c-title-err' : ''}`"
            >
            <small id="c-title-count" class="challenge-form__count">{{ count(form.title, 60) }}</small>
            <p v-if="err('title')" id="c-title-err" class="challenge-form__error">{{ err('title') }}</p>
          </div>
        </div>
        <p v-if="err('emoji')" id="c-emoji-err" class="challenge-form__error">{{ err('emoji') }}</p>
        <div class="challenge-form__emojis" role="group" aria-label="Emoji suggerite">
          <button
            v-for="e in EMOJIS" :key="e" type="button" class="challenge-form__emoji-pick" :aria-pressed="form.emoji === e"
            :aria-label="`Usa ${e}`" @click="form.emoji = e"
          >
            {{ e }}
          </button>
        </div>
        <div class="challenge-form__field">
          <label for="c-desc" class="label">Descrizione in italiano <small class="u-muted">— cosa deve mostrare l'immagine</small></label>
          <textarea
            id="c-desc" v-model="form.description" maxlength="200" rows="3" class="input"
            placeholder="Costumi, cappellini e mantelli: il più elegante di Halloween."
            :aria-invalid="!!err('description')" :aria-describedby="`c-desc-count${err('description') ? ' c-desc-err' : ''}`"
          />
          <small id="c-desc-count" class="challenge-form__count">{{ count(form.description, 200) }}</small>
          <p v-if="err('description')" id="c-desc-err" class="challenge-form__error">{{ err('description') }}</p>
        </div>
      </section>

      <!-- 2. Traduzioni: una scheda per lingua -->
      <section class="challenge-form__section" aria-labelledby="cf-lang">
        <h2 id="cf-lang" class="challenge-form__heading">
          <span class="challenge-form__num" aria-hidden="true">2</span> Traduzioni
          <span class="challenge-form__badge" :class="missing ? 'challenge-form__badge--todo' : 'challenge-form__badge--ok'">
            {{ missing ? `${missing} da completare` : 'Tutte complete' }}
          </span>
        </h2>
        <p class="challenge-form__help">Obbligatorie: chi usa il sito in un'altra lingua vede questi testi.</p>
        <div class="challenge-form__tabs" role="tablist" aria-label="Lingua" @keydown="onTabKey">
          <button
            v-for="l in otherLanguages" :id="`c-tab-${l.code}`" :key="l.code" type="button" role="tab" class="challenge-form__tab"
            :aria-selected="activeLang === l.code" :aria-controls="`c-panel-${l.code}`" :tabindex="activeLang === l.code ? 0 : -1"
            @click="activeLang = l.code"
          >
            <span class="challenge-form__tab-state" :class="{ 'is-done': complete(l.code) }" aria-hidden="true">{{ complete(l.code) ? '✓' : '!' }}</span>
            {{ l.name }}
            <span class="u-visually-hidden">{{ complete(l.code) ? '(completa)' : '(da completare)' }}</span>
          </button>
        </div>
        <div
          v-for="l in otherLanguages" v-show="activeLang === l.code" :id="`c-panel-${l.code}`" :key="l.code"
          role="tabpanel" :aria-labelledby="`c-tab-${l.code}`" class="challenge-form__panel" :lang="l.code"
        >
          <div class="challenge-form__field">
            <label :for="`c-title-${l.code}`" class="label">Titolo</label>
            <input
              :id="`c-title-${l.code}`" v-model="form.translations[l.code]!.title" maxlength="60" class="input" :placeholder="form.title"
              :aria-invalid="!!err(`translations.${l.code}.title`)"
            >
            <small class="challenge-form__count">{{ count(form.translations[l.code]!.title, 60) }}</small>
            <p v-if="err(`translations.${l.code}.title`)" class="challenge-form__error">{{ err(`translations.${l.code}.title`) }}</p>
          </div>
          <div class="challenge-form__field">
            <label :for="`c-desc-${l.code}`" class="label">Descrizione</label>
            <textarea
              :id="`c-desc-${l.code}`" v-model="form.translations[l.code]!.description" maxlength="200" rows="3" class="input" :placeholder="form.description"
              :aria-invalid="!!err(`translations.${l.code}.description`)"
            />
            <small class="challenge-form__count">{{ count(form.translations[l.code]!.description, 200) }}</small>
            <p v-if="err(`translations.${l.code}.description`)" class="challenge-form__error">{{ err(`translations.${l.code}.description`) }}</p>
          </div>
        </div>
      </section>

      <!-- 3. Quando e per chi -->
      <section class="challenge-form__section" aria-labelledby="cf-when">
        <h2 id="cf-when" class="challenge-form__heading"><span class="challenge-form__num" aria-hidden="true">3</span> Quando e per chi</h2>
        <p v-if="lockDate" class="challenge-form__lock">🔒 È già iniziata: la data non si può più cambiare.</p>
        <div class="challenge-form__field">
          <label for="c-start" class="label">Inizio</label>
          <div class="challenge-form__date">
            <input
              id="c-start" v-model="form.startDate" type="date" class="input challenge-form__date-input" :disabled="lockDate"
              :aria-invalid="!!err('startDate') || inPast" aria-describedby="c-range"
            >
            <div v-if="!lockDate" class="challenge-form__quick" role="group" aria-label="Date rapide">
              <button
                v-for="q in quickDates" :key="q.value" type="button" class="chip" :aria-pressed="form.startDate === q.value"
                @click="form.startDate = q.value"
              >
                {{ q.label }}
              </button>
            </div>
          </div>
          <p id="c-range" class="challenge-form__range">
            <span aria-hidden="true">🗓</span> {{ range || 'Scegli una data' }} <small class="u-muted">· dura 7 giorni</small>
          </p>
          <p v-if="err('startDate')" class="challenge-form__error">{{ err('startDate') }}</p>
          <p v-if="inPast" class="challenge-form__error" role="alert">Finirebbe nel passato: scegli una data più avanti.</p>
          <p v-else-if="notMonday && !lockDate" class="challenge-form__note">Non è un lunedì: va bene lo stesso, ma le sfide automatiche partono di lunedì.</p>
          <div v-if="overlapping.length" class="challenge-form__overlap" role="status">
            <b>Nella stessa settimana {{ overlapping.length === 1 ? 'c\'è un\'altra sfida' : `ci sono altre ${overlapping.length} sfide` }}:</b>
            si giocheranno in parallelo. Una automatica senza partecipanti lascia il posto a questa.
            <ul class="challenge-form__overlap-list">
              <li v-for="o in overlapping" :key="o.id">{{ o.emoji }} {{ o.title }}<template v-if="o.automatic"> <small class="u-muted">(automatica)</small></template></li>
            </ul>
          </div>
        </div>

        <p v-if="lockAudience" class="challenge-form__lock">🔒 Ha già partecipanti: per chi è aperta non si può più cambiare.</p>
        <div class="challenge-form__audience">
          <div v-if="SPECIES.length" class="challenge-form__field challenge-form__grow">
            <label for="c-species" class="label">Per chi</label>
            <select id="c-species" v-model="form.species" class="input" :disabled="lockAudience">
              <option :value="null">Tutte le categorie</option>
              <option v-for="s in SPECIES" :key="s" :value="s">Solo {{ speciesName(s, 'many').toLowerCase() }}</option>
            </select>
          </div>
          <label v-if="features.shelters" class="challenge-form__check">
            <input v-model="form.adoptionOnly" type="checkbox" class="challenge-form__checkbox" :disabled="lockAudience">
            <span><b>Solo rifugi</b><small>Per i pet dei rifugi che cercano casa</small></span>
          </label>
          <p v-if="!SPECIES.length && !features.shelters" class="challenge-form__help">Aperta a tutti.</p>
        </div>
      </section>
    </div>

    <!-- Anteprima e azioni: restano a vista accanto al modulo sui computer -->
    <aside class="challenge-form__side" aria-labelledby="cf-preview">
      <h2 id="cf-preview" class="challenge-form__side-title">Anteprima</h2>
      <div class="challenge-form__preview" inert>
        <ChallengeCard :challenge="preview" big />
      </div>
      <p class="challenge-form__side-help">Così appare nell'elenco delle sfide, in italiano. L'indirizzo della sfida si decide al primo salvataggio e poi non cambia.</p>
    </aside>

    <!-- Azioni: una barra che resta in fondo allo schermo finché si è nel modulo -->
    <div class="challenge-form__bar">
      <p v-if="error" class="error challenge-form__bar-error" role="alert">{{ error }}</p>
      <p class="challenge-form__unsaved" role="status">{{ dirty ? '● Modifiche non salvate' : '' }}</p>
      <div class="challenge-form__actions">
        <button type="button" class="btn btn--ghost" @click="emit('cancel')">Annulla</button>
        <button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? 'Salvataggio…' : submitLabel }}</button>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
// Organismo: modulo di una sfida (admin) con anteprima; sui computer anteprima e azioni restano a vista a destra
.challenge-form {
  display: grid;
  gap: $space-5;
  align-items: start;

  @include mq(lg) { grid-template-columns: minmax(0, 1fr) 320px; }

  &__main { @include stack($space-4); min-width: 0; }

  &__section { @include card(18px, $radius-lg); @include stack($space-3); }

  &__heading { display: flex; flex-wrap: wrap; align-items: center; gap: $space-2 $space-3; margin: 0; font-size: 19px; }

  &__num {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--ink);
    color: var(--bg);
    font-size: 14px;
    font-weight: 900;
  }

  &__badge {
    padding: 2px 10px;
    border-radius: $radius-pill;
    font-family: var(--body, inherit);
    font-size: 12px;
    font-weight: 800;

    &--ok { background: color-mix(in srgb, var(--mint) 18%, var(--surface)); color: color-mix(in srgb, var(--mint) 45%, var(--ink)); }

    &--todo { background: color-mix(in srgb, var(--sun) 30%, var(--surface)); color: var(--ink); }
  }

  &__help, &__side-help { margin: 0; color: var(--muted); font-size: 13px; }

  &__theme { display: flex; gap: $space-3; align-items: flex-start; }

  &__field { @include stack(4px); position: relative; min-width: 0; }

  &__field--emoji { width: 76px; flex-shrink: 0; }

  &__grow { flex: 1 1 200px; }

  &__emoji-input { text-align: center; font-size: 24px; padding: 6px; }

  &__emojis { display: flex; flex-wrap: wrap; gap: 6px; }

  &__emoji-pick {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--surface);
    font-size: 20px;
    cursor: pointer;

    &:hover { border-color: var(--ink); }

    &[aria-pressed="true"] { border-color: var(--coral); background: var(--coral-soft); }
  }

  &__count { align-self: flex-end; color: var(--muted); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }

  &__error { margin: 0; color: var(--link); font-size: 13px; font-weight: 800; }

  &__note { margin: 0; color: var(--muted); font-size: 13px; font-weight: 700; }

  &__tabs { display: flex; gap: 4px; padding: 4px; border-radius: $radius-pill; background: color-mix(in srgb, var(--line) 60%, var(--bg)); @include scroll-row; }

  &__tab {
    flex: 1 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: $radius-pill;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;

    &[aria-selected="true"] { background: var(--surface); box-shadow: 0 1px 4px var(--shadow); }
  }

  &__tab-state {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--sun);
    color: var(--ink);
    font-size: 11px;
    font-weight: 900;

    &.is-done { background: var(--mint); color: #fff; }
  }

  &__panel { @include stack($space-3); }

  &__date { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; }

  &__date-input { width: auto; min-width: 170px; }

  &__quick { display: flex; flex-wrap: wrap; gap: $space-2; }

  &__range { margin: 0; font-weight: 800; font-size: 14px; }

  &__overlap {
    padding: 10px 14px;
    border-radius: $radius-md;
    background: color-mix(in srgb, var(--sun) 18%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--sun-deep) 45%, var(--line));
    font-size: 14px;
  }

  &__overlap-list { margin: 6px 0 0; padding-left: 18px; font-weight: 700; }

  &__lock { margin: 0; padding: 8px 12px; border-radius: $radius-md; background: color-mix(in srgb, var(--line) 50%, var(--surface)); font-size: 13px; font-weight: 700; }

  &__audience { display: flex; flex-wrap: wrap; gap: $space-4; align-items: flex-end; }

  &__check {
    display: flex;
    gap: $space-3;
    align-items: flex-start;
    cursor: pointer;

    span { @include stack(0); }

    small { color: var(--muted); font-size: 13px; }
  }

  &__checkbox { width: 22px; height: 22px; margin: 2px 0 0; accent-color: var(--coral); }

  &__side {
    @include stack($space-3);

    @include mq(lg) { position: sticky; top: 16px; }
  }

  &__side-title { margin: 0; font-size: 15px; font-weight: 800; color: var(--muted); }

  &__preview { pointer-events: none; }

  &__bar {
    grid-column: 1 / -1;
    position: sticky;
    bottom: 8px;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-2 $space-4;
    padding: 10px 12px 10px 16px;
    border-radius: $radius-lg;
    background: var(--surface);
    box-shadow: 0 10px 30px -10px var(--shadow), 0 0 0 1px var(--line);
  }

  &__bar-error { flex-basis: 100%; margin: 0; }

  &__actions { display: flex; flex-wrap: wrap; gap: $space-2; margin-left: auto; }

  &__unsaved { margin: 0; color: var(--muted); font-size: 13px; font-weight: 800; &:empty { display: none; } }
}
</style>
