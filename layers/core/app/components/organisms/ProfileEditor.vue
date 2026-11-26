<script setup lang="ts">
import { linkLabel, linkPlatform, withProtocol } from '../../utils/links'
import { COMMISSION_STATUSES, HAS_ARTISTS, MAX_ARTIST_LINKS, artistSettingsSchema, type ArtistSettings, type CommissionStatus, type Profile } from '#shared/models'

/**
 * Organismo: "Modifica profilo" della pagina account. Bio, pronomi e (dove c'è askCredit) il profilo da artista
 * in un solo modulo, con l'anteprima della testata che cambia mentre si scrive. Si salva una volta sola, dalla
 * barra che compare in basso appena c'è qualcosa di nuovo; uscendo senza salvare la pagina lo chiede prima.
 * I controlli sono accanto ai campi: dopo che si è lasciato il campo, o tutti insieme quando si salva
 * (e allora il fuoco va al primo da correggere)
 */
const dirty = defineModel<boolean>('dirty', { default: false })
const { t } = useI18n()
const { user } = useUserSession()
const uid = useId()

const { data: profile, refresh } = await useFetch<Profile>(() => `/api/users/${user.value?.username}`, { key: 'my-profile-about' })
const { data: artistData } = await useFetch<ArtistSettings>('/api/me/artist', { immediate: HAS_ARTISTS })

// --- Il modulo e l'ultima versione salvata, per sapere se c'è qualcosa di nuovo ---
interface LinkRow { key: number, url: string }
interface Form { bio: string, pronouns: string, isArtist: boolean, commissions: CommissionStatus, commissionsUrl: string, links: LinkRow[] }
let nextKey = 0
const rows = (links: string[]): LinkRow[] => (links.length ? links : ['']).map(url => ({ key: nextKey++, url }))
const fromData = (): Form => ({
  bio: profile.value?.bio ?? '',
  pronouns: profile.value?.pronouns ?? '',
  isArtist: artistData.value?.isArtist ?? false,
  commissions: artistData.value?.commissions ?? '',
  commissionsUrl: artistData.value?.commissionsUrl ?? '',
  links: rows(artistData.value?.links ?? []),
})
const form = reactive<Form>(fromData())
const savedForm = ref<Form>(fromData())

// Ciò che conta davvero: spazi ai lati e righe vuote non sono modifiche
const clean = (f: Form) => ({
  bio: f.bio.trim(),
  pronouns: f.pronouns.trim(),
  isArtist: f.isArtist,
  commissions: f.commissions,
  commissionsUrl: f.commissionsUrl.trim(),
  links: f.links.map(l => l.url.trim()).filter(Boolean),
})
const aboutChanged = computed(() => {
  const [a, b] = [clean(form), clean(savedForm.value)]
  return a.bio !== b.bio || a.pronouns !== b.pronouns
})
const artistChanged = computed(() => {
  if (!HAS_ARTISTS) return false
  const { bio: _a, pronouns: _b, ...a } = clean(form)
  const { bio: _c, pronouns: _d, ...b } = clean(savedForm.value)
  return JSON.stringify(a) !== JSON.stringify(b)
})
const isDirty = computed(() => aboutChanged.value || artistChanged.value)
watch(isDirty, v => (dirty.value = v), { immediate: true })

function reset() {
  Object.assign(form, structuredClone(toRaw(savedForm.value)))
  submitted.value = false
  touched.clear()
  serverError.value = ''
}
// Arrivano i dati (o tornano dopo aver cambiato avatar): se non si sta scrivendo, il modulo li riprende
watch([profile, artistData], () => {
  savedForm.value = fromData()
  if (!isDirty.value) reset()
})

// --- Controlli ---
const urlOk = (v: string) => artistSettingsSchema.shape.commissionsUrl.safeParse(v).success && !!linkPlatform(v)
const fieldId = (name: string) => `${uid}-${name}`
const touched = reactive(new Set<string>())
const submitted = ref(false)
// Nell'ordine in cui i campi stanno nella pagina: il primo è quello su cui va il fuoco
const errors = computed(() => {
  const out: Record<string, string> = {}
  if (!HAS_ARTISTS || !form.isArtist) return out
  if (form.commissions === 'open' && form.commissionsUrl.trim() && !urlOk(form.commissionsUrl.trim())) out[fieldId('curl')] = 'artist.urlInvalid'
  const seen = new Set<string>()
  for (const l of form.links) {
    const v = l.url.trim()
    if (!v) continue
    if (!urlOk(v)) out[fieldId(`link-${l.key}`)] = 'artist.urlInvalid'
    else if (seen.has(v.toLowerCase())) out[fieldId(`link-${l.key}`)] = 'artist.duplicateLink'
    seen.add(v.toLowerCase())
  }
  return out
})
const errorFor = (id: string) => (submitted.value || touched.has(id)) ? errors.value[id] : undefined
function leave(id: string, apply?: (v: string) => void, value?: string) {
  if (apply && value !== undefined) apply(withProtocol(value))
  touched.add(id)
}

// --- Pronomi: un tocco su un suggerimento ---
const pronounChoices = computed(() => t('profile.pronounsList').split(',').map(s => s.trim()).filter(Boolean))

// --- Link: aggiungi, togli, sposta (il fuoco resta dove ci si aspetta) ---
const focusLater = (id: string) => nextTick(() => document.getElementById(id)?.focus())
function addLink() {
  if (form.links.length >= MAX_ARTIST_LINKS) return
  const row = { key: nextKey++, url: '' }
  form.links.push(row)
  focusLater(fieldId(`link-${row.key}`))
}
function removeLink(i: number) {
  form.links.splice(i, 1)
  if (!form.links.length) form.links.push({ key: nextKey++, url: '' })
  const next = form.links[Math.min(i, form.links.length - 1)]!
  focusLater(fieldId(`link-${next.key}`))
}
function moveLink(i: number, step: -1 | 1) {
  const j = i + step
  if (j < 0 || j >= form.links.length) return
  const [row] = form.links.splice(i, 1)
  form.links.splice(j, 0, row!)
  // Il bottone premuto segue il link; arrivato in cima (o in fondo) si passa all'altro
  const edge = j === 0 || j === form.links.length - 1
  focusLater(fieldId(`${edge ? (step < 0 ? 'down' : 'up') : (step < 0 ? 'up' : 'down')}-${row!.key}`))
}
const filledLinks = computed(() => form.links.filter(l => l.url.trim()).length)
const hadHiddenArtistData = computed(() => HAS_ARTISTS && !form.isArtist && (clean(form).links.length > 0 || form.commissions !== ''))

// --- Anteprima: il profilo com'è adesso, con quello che si sta scrivendo ---
const preview = computed<Profile | null>(() => {
  if (!profile.value) return null
  const c = clean(form)
  return {
    ...profile.value,
    isMe: true,
    bio: c.bio,
    pronouns: c.pronouns,
    artist: HAS_ARTISTS && c.isArtist ? { links: [...new Set(c.links)], commissions: c.commissions, commissionsUrl: c.commissions === 'open' ? c.commissionsUrl : '' } : null,
  }
})

// --- Salvataggio ---
const saving = ref(false)
const serverError = ref('')
const announce = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined
function say(text: string) {
  announce.value = text
  clearTimeout(announceTimer)
  announceTimer = setTimeout(() => (announce.value = ''), 4000)
}

async function save() {
  submitted.value = true
  serverError.value = ''
  const wrong = Object.keys(errors.value)
  if (wrong.length) {
    say(t('account.fixErrors', { n: wrong.length }, wrong.length))
    const el = document.getElementById(wrong[0]!)
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    el?.focus({ preventScroll: true })
    return
  }
  saving.value = true
  try {
    const c = clean(form)
    if (aboutChanged.value) await $fetch('/api/me/profile', { method: 'PUT', body: { bio: c.bio, pronouns: c.pronouns } })
    let links = c.links
    if (artistChanged.value) {
      const res = await $fetch<ArtistSettings>('/api/me/artist', { method: 'PUT', body: { isArtist: c.isArtist, links: c.links, commissions: c.commissions, commissionsUrl: c.commissionsUrl } })
      links = res.links
    }
    Object.assign(form, { ...c, links: rows(links) })
    savedForm.value = structuredClone(toRaw(form))
    submitted.value = false
    touched.clear()
    say(t('account.saved'))
  }
  catch (e) {
    serverError.value = errorMessage(e, 'validation.check')
  }
  finally {
    saving.value = false
  }
}

// --- Uscire senza salvare: lo si chiede, sia cambiando pagina nel sito sia chiudendo la scheda ---
const router = useRouter()
const offGuard = router.beforeEach((to, from) => to.path === from.path || !isDirty.value || window.confirm(t('account.unsavedConfirm')))
function onUnload(e: BeforeUnloadEvent) {
  if (!isDirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', onUnload))
onBeforeUnmount(() => {
  offGuard()
  window.removeEventListener('beforeunload', onUnload)
  clearTimeout(announceTimer)
})

const statusHint: Record<CommissionStatus, string> = { open: 'artist.commissions.openHint', closed: 'artist.commissions.closedHint', '': 'artist.commissions.noneHint' }
</script>

<template>
  <div class="profile-editor">
    <aside v-if="preview" class="profile-editor__preview" :aria-labelledby="fieldId('pv')">
      <h3 :id="fieldId('pv')" class="profile-editor__eyebrow">{{ $t('account.previewTitle') }}</h3>
      <ProfilePreview :profile="preview" @saved="refresh()" />
      <p class="hint">{{ $t('account.previewHint') }}</p>
    </aside>

    <form class="profile-editor__form" novalidate @submit.prevent="save">
      <!-- Su di te -->
      <article class="profile-editor__card" :aria-labelledby="fieldId('about')">
        <h3 :id="fieldId('about')" class="profile-editor__card-title">{{ $t('profile.aboutTitle') }}</h3>
        <div class="field">
          <div class="profile-editor__label-row">
            <label :for="fieldId('bio')" class="label">{{ $t('profile.bio') }} <small>({{ $t('common.optional') }})</small></label>
            <small :id="fieldId('bio-count')" class="profile-editor__count" :class="{ 'is-near': form.bio.length > 270 }">
              {{ $t('profile.bioCount', { n: form.bio.length, max: 300 }) }}
            </small>
          </div>
          <textarea
            :id="fieldId('bio')" v-model="form.bio" class="input profile-editor__input" rows="4" maxlength="300"
            :aria-describedby="`${fieldId('bio-hint')} ${fieldId('bio-count')}`"
          />
          <small :id="fieldId('bio-hint')" class="hint">{{ $t('profile.bioHint') }}</small>
        </div>

        <div class="field">
          <label :for="fieldId('pronouns')" class="label">{{ $t('profile.pronouns') }} <small>({{ $t('common.optional') }})</small></label>
          <input
            :id="fieldId('pronouns')" v-model="form.pronouns" class="input profile-editor__input" maxlength="30" autocomplete="off"
            :placeholder="$t('profile.pronounsHint')"
          >
          <div class="profile-editor__chips" role="group" :aria-label="$t('profile.pronounsSuggest')">
            <button
              v-for="p in pronounChoices" :key="p" type="button" class="chip profile-editor__chip"
              :aria-pressed="form.pronouns.trim() === p" @click="form.pronouns = form.pronouns.trim() === p ? '' : p"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </article>

      <!-- Profilo da artista -->
      <article v-if="HAS_ARTISTS" id="artist" class="profile-editor__card" :aria-labelledby="fieldId('artist')">
        <h3 :id="fieldId('artist')" class="profile-editor__card-title">🎨 {{ $t('artist.title') }}</h3>

        <label class="profile-editor__switch">
          <input v-model="form.isArtist" type="checkbox" role="switch" class="profile-editor__switch-input" :aria-describedby="fieldId('artist-help')">
          <span class="profile-editor__switch-track" aria-hidden="true"><span class="profile-editor__switch-thumb" /></span>
          <span class="profile-editor__switch-text">{{ $t('artist.toggle') }}</span>
        </label>
        <p :id="fieldId('artist-help')" class="hint">{{ $t('artist.toggleHelp') }}</p>
        <p v-if="hadHiddenArtistData" class="profile-editor__note">{{ $t('artist.offNote') }}</p>

        <template v-if="form.isArtist">
          <!-- Commissioni: tre scelte grandi, con cosa vedrà chi visita -->
          <fieldset class="profile-editor__group">
            <legend class="label profile-editor__legend">{{ $t('artist.commissions.title') }}</legend>
            <div class="profile-editor__status">
              <label v-for="c in COMMISSION_STATUSES" :key="c" class="profile-editor__status-option" :class="`is-${c || 'none'}`">
                <input v-model="form.commissions" type="radio" :name="fieldId('commissions')" :value="c" class="profile-editor__status-radio" :aria-describedby="fieldId(`st-${c || 'none'}`)">
                <span class="profile-editor__status-dot" aria-hidden="true" />
                <span class="profile-editor__status-text">
                  <b>{{ $t(`artist.commissions.${c || 'none'}`) }}</b>
                  <small :id="fieldId(`st-${c || 'none'}`)">{{ $t(statusHint[c]) }}</small>
                </span>
              </label>
            </div>
          </fieldset>

          <div v-if="form.commissions === 'open'" class="field">
            <label :for="fieldId('curl')" class="label">{{ $t('artist.commissions.url') }}</label>
            <div class="profile-editor__link-input">
              <LinkBadge :url="form.commissionsUrl" />
              <input
                :id="fieldId('curl')" v-model="form.commissionsUrl" type="url" inputmode="url" maxlength="200" placeholder="https://"
                autocomplete="url" class="input profile-editor__input" :aria-invalid="!!errorFor(fieldId('curl'))"
                :aria-describedby="fieldId('curl-msg')" @blur="leave(fieldId('curl'), v => (form.commissionsUrl = v), form.commissionsUrl)"
              >
            </div>
            <small :id="fieldId('curl-msg')" class="profile-editor__msg" :class="{ 'is-error': errorFor(fieldId('curl')) }">
              <template v-if="errorFor(fieldId('curl'))"><span aria-hidden="true">⚠ </span>{{ $t(errorFor(fieldId('curl'))!) }}</template>
              <template v-else-if="!form.commissionsUrl.trim()">{{ $t('artist.commissions.urlMissing') }} {{ $t('artist.commissions.urlHint') }}</template>
              <template v-else-if="linkPlatform(form.commissionsUrl.trim())">{{ $t('artist.detected', { name: linkLabel(form.commissionsUrl.trim()) }) }}</template>
              <template v-else>{{ $t('artist.commissions.urlHint') }}</template>
            </small>
          </div>

          <!-- Pagine social: il sito si riconosce dal link -->
          <fieldset class="profile-editor__group">
            <legend class="profile-editor__legend profile-editor__label-row">
              <span class="label">{{ $t('artist.links') }}</span>
              <small class="profile-editor__count">{{ $t('artist.linksCount', { n: filledLinks, max: MAX_ARTIST_LINKS }) }}</small>
            </legend>
            <p :id="fieldId('links-hint')" class="hint">{{ $t('artist.linksHint') }}</p>
            <ol class="profile-editor__links">
              <li v-for="(l, i) in form.links" :key="l.key" class="profile-editor__link-row">
                <div class="profile-editor__link-input">
                  <LinkBadge :url="l.url" />
                  <input
                    :id="fieldId(`link-${l.key}`)" v-model="l.url" type="url" inputmode="url" maxlength="200" placeholder="https://" autocomplete="off"
                    class="input profile-editor__input" :aria-label="$t('artist.linkN', { n: i + 1 })" :aria-invalid="!!errorFor(fieldId(`link-${l.key}`))"
                    :aria-describedby="`${fieldId(`link-${l.key}-msg`)} ${fieldId('links-hint')}`"
                    @blur="leave(fieldId(`link-${l.key}`), v => (l.url = v), l.url)"
                  >
                </div>
                <div class="profile-editor__tools">
                  <button
                    v-if="i > 0" :id="fieldId(`up-${l.key}`)" type="button" class="profile-editor__tool" :aria-label="$t('artist.moveUp', { n: i + 1 })"
                    :title="$t('artist.moveUp', { n: i + 1 })" @click="moveLink(i, -1)"
                  >
                    ↑
                  </button>
                  <button
                    v-if="i < form.links.length - 1" :id="fieldId(`down-${l.key}`)" type="button" class="profile-editor__tool"
                    :aria-label="$t('artist.moveDown', { n: i + 1 })" :title="$t('artist.moveDown', { n: i + 1 })" @click="moveLink(i, 1)"
                  >
                    ↓
                  </button>
                  <button
                    v-if="form.links.length > 1 || l.url" type="button" class="profile-editor__tool profile-editor__tool--remove"
                    :aria-label="$t('artist.removeLink', { n: i + 1 })" :title="$t('artist.removeLink', { n: i + 1 })" @click="removeLink(i)"
                  >
                    ✕
                  </button>
                </div>
                <small :id="fieldId(`link-${l.key}-msg`)" class="profile-editor__msg" :class="{ 'is-error': errorFor(fieldId(`link-${l.key}`)) }">
                  <template v-if="errorFor(fieldId(`link-${l.key}`))"><span aria-hidden="true">⚠ </span>{{ $t(errorFor(fieldId(`link-${l.key}`))!) }}</template>
                  <template v-else-if="linkPlatform(l.url.trim())">{{ $t('artist.detected', { name: linkLabel(l.url.trim()) }) }}</template>
                </small>
              </li>
            </ol>
            <button v-if="form.links.length < MAX_ARTIST_LINKS" type="button" class="btn btn--ghost profile-editor__add" @click="addLink">
              + {{ $t('artist.addLink') }}
            </button>
          </fieldset>
        </template>
      </article>

      <!-- Barra di salvataggio: compare appena c'è qualcosa da salvare, e resta in vista in fondo allo schermo -->
      <div class="profile-editor__bar" :class="{ 'is-visible': isDirty || serverError }">
        <p class="profile-editor__bar-text">
          <span v-if="serverError" class="profile-editor__bar-error" role="alert"><span aria-hidden="true">⚠ </span>{{ serverError }}</span>
          <template v-else><span class="profile-editor__bar-dot" aria-hidden="true" />{{ $t('account.unsaved') }}</template>
        </p>
        <div class="profile-editor__bar-buttons">
          <button type="button" class="btn btn--ghost" :disabled="saving" @click="reset">{{ $t('account.discard') }}</button>
          <button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? $t('common.saving') : $t('account.saveAll') }}</button>
        </div>
      </div>
      <p class="u-visually-hidden" role="status">{{ announce }}</p>
      <p v-if="announce && !isDirty && !serverError" class="profile-editor__saved" aria-hidden="true">✓ {{ announce }}</p>
    </form>
  </div>
</template>

<style lang="scss" scoped>
// Organismo: modifica del profilo con anteprima. Telefono: anteprima sopra; computer: a destra, ferma mentre si scorre
.profile-editor {
  display: grid;
  gap: $space-7;
  align-items: start;

  @include mq(lg) { grid-template-columns: minmax(0, 1fr) minmax(300px, 360px); }

  &__preview {
    @include stack($space-3);
    min-width: 0;

    @include mq(lg) { grid-column: 2; grid-row: 1; position: sticky; top: 76px; }
  }

  &__eyebrow { @include eyebrow(12px); margin: 0; }

  &__form { @include stack($space-7); min-width: 0; }

  &__card {
    @include card(18px 20px, 24px);
    @include stack($space-6);
    // Arrivando da #artist la scheda si ferma sotto l'indice della pagina
    scroll-margin-top: 76px;
  }

  &__card-title { margin: 0; font-family: var(--display); font-size: 20px; }

  &__label-row { display: flex; justify-content: space-between; align-items: baseline; gap: $space-3; width: 100%; }

  &__count {
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    &.is-near { color: var(--link); }
  }

  // Bordo più deciso del normale: il campo si deve distinguere dallo sfondo (3:1)
  &__input {
    border-color: color-mix(in srgb, var(--muted) 70%, var(--line));
    min-height: 44px;

    &[aria-invalid="true"] { border-color: var(--link); box-shadow: 0 0 0 1px var(--link); }
  }

  &__chips { @include cluster($space-2); }

  &__chip { min-height: 36px; }

  &__note {
    margin: 0;
    padding: 10px 12px;
    border-radius: $radius-sm;
    background: var(--bg);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
  }

  // Interruttore "Sono un artista": una casella vera, disegnata come un interruttore
  &__switch { display: flex; align-items: center; gap: $space-5; min-height: 44px; cursor: pointer; font-weight: 800; }

  &__switch-input { @include visually-hidden; }

  &__switch-track {
    flex: none;
    position: relative;
    width: 52px;
    height: 30px;
    border-radius: $radius-pill;
    background: color-mix(in srgb, var(--muted) 55%, var(--surface));
    transition: background .15s;
  }

  &__switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
    transition: transform .15s;
  }

  &__switch-input:checked + &__switch-track { background: var(--action); }

  &__switch-input:checked + &__switch-track &__switch-thumb { transform: translateX(22px); }

  &__switch-input:focus-visible + &__switch-track { outline: 3px solid var(--ink); outline-offset: 2px; }

  &__group { @include stack($space-3); margin: 0; padding: 0; border: 0; min-width: 0; }

  &__legend { padding: 0; margin-bottom: $space-3; }

  // Stato delle commissioni: tre schede da toccare, colore e frase per capire subito cosa si vedrà
  &__status { display: grid; gap: $space-3; grid-template-columns: 1fr; @include mq(sm) { grid-template-columns: repeat(3, 1fr); } }

  &__status-option {
    position: relative;
    display: flex;
    gap: $space-4;
    align-items: flex-start;
    padding: 12px;
    min-height: 44px;
    border: 2px solid color-mix(in srgb, var(--muted) 35%, var(--line));
    border-radius: $radius-md;
    cursor: pointer;
    background: var(--surface);

    &:has(:checked) { border-color: var(--action); background: var(--coral-soft); }

    &.is-open:has(:checked) { border-color: color-mix(in srgb, var(--mint) 70%, var(--ink)); background: color-mix(in srgb, var(--mint) 16%, var(--surface)); }

    &:has(:focus-visible) { outline: 3px solid var(--ink); outline-offset: 2px; }
  }

  &__status-radio { @include visually-hidden; }

  &__status-dot {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    border-radius: 50%;
    border: 2px solid var(--muted);
    background: var(--surface);

    .is-open & { border-color: color-mix(in srgb, var(--mint) 70%, var(--ink)); }

    :checked ~ & { background: currentColor; box-shadow: inset 0 0 0 3px var(--surface); }

    .is-open :checked ~ & { color: color-mix(in srgb, var(--mint) 70%, var(--ink)); }

    .is-closed :checked ~ &, .is-none :checked ~ & { color: var(--link); border-color: var(--link); }
  }

  &__status-text {
    @include stack(2px);
    min-width: 0;

    b { font-size: 15px; }

    small { color: var(--muted); font-size: 13px; font-weight: 600; line-height: 1.35; }
  }

  // Link: bollino del sito, campo, e strumenti (su, giù, togli)
  &__links { @include stack($space-4); margin: 0; padding: 0; list-style: none; }

  &__link-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: $space-2 $space-3;
    align-items: center;

    // Sui telefoni il campo prende tutta la riga; sotto, il messaggio a sinistra e gli strumenti a destra
    @include mq-down(sm) {
      .profile-editor__link-input { grid-column: 1 / -1; }

      .profile-editor__msg { grid-column: 1; grid-row: 2; }
    }
  }

  &__link-input { display: flex; align-items: center; gap: $space-3; min-width: 0; }

  &__tools {
    display: flex;
    gap: $space-2;
    justify-content: flex-end;

    @include mq-down(sm) { grid-column: 2; grid-row: 2; }
  }

  &__tool {
    width: 44px;
    height: 44px;
    border: 2px solid var(--line);
    border-radius: 50%;
    background: var(--surface);
    color: var(--ink);
    font-weight: 900;
    font-size: 16px;
    cursor: pointer;

    &:hover { background: var(--bg); }

    &--remove { color: var(--link); }
  }

  &__msg {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;

    &:empty { display: none; @include mq-down(sm) { display: block; } }

    &.is-error { color: var(--link); }
  }

  &__add { align-self: flex-start; }

  // Barra in basso: sopra il dock del telefono, in fondo allo schermo sul computer
  &__bar {
    position: sticky;
    bottom: calc(max(8px, env(safe-area-inset-bottom)) + 84px);
    z-index: $z-dock;
    display: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3 $space-5;
    padding: 10px 12px 10px 16px;
    border-radius: $radius-lg;
    background: var(--surface);
    box-shadow: 0 0 0 2px var(--action), 0 14px 30px -12px var(--shadow);

    &.is-visible { display: flex; }

    @include mq(md) { bottom: max(16px, env(safe-area-inset-bottom)); }
  }

  &__bar-text { margin: 0; display: flex; align-items: center; gap: $space-3; font-weight: 800; }

  &__bar-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--action); }

  &__bar-error { color: var(--link); }

  &__bar-buttons { @include cluster($space-3); margin-left: auto; }

  &__saved { margin: 0; align-self: flex-end; color: color-mix(in srgb, var(--mint) 55%, var(--ink)); font-weight: 900; }
}
</style>
