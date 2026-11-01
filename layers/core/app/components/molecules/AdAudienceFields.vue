<script setup lang="ts">
import { AD_LANGS, SPECIES, SPECIES_EMOJI, type AdLang, type AdTargeting, type Species } from '#shared/models'

/**
 * Pubblico della campagna (admin): dove (paesi e zone attorno a una città), lingua, specie, utenti.
 * Le città si cercano su OpenStreetMap (Nominatim): solo col pulsante, come chiedono le loro regole d'uso
 */
const t = defineModel<AdTargeting>({ required: true })

const limited = ref(t.value.countries.length > 0 || t.value.places.length > 0)
watch(limited, (on) => {
  if (!on) {
    t.value.countries = []
    t.value.places = []
  }
})

const countries = ALL_COUNTRIES()
const near = NEAR_COUNTRIES.map(code => ({ code, name: countryName(code) }))
function addCountry(code: string) {
  if (code && !t.value.countries.includes(code)) t.value.countries = [...t.value.countries, code]
}
const removeCountry = (code: string) => (t.value.countries = t.value.countries.filter(c => c !== code))

// --- Ricerca di città e zone ---
interface Found { label: string, lat: number, lng: number, km: number, country?: string, kind: string }
const query = ref('')
const found = ref<Found[]>([])
const searching = ref(false)
const searchError = ref('')
// Raggio proposto in base a cosa si è trovato: un quartiere è piccolo, una regione grande
const KM_BY_KIND: Record<string, number> = { suburb: 3, quarter: 3, neighbourhood: 2, village: 5, town: 10, city: 15, municipality: 15, county: 40, province: 40, state: 120, region: 120 }
const KIND_NAMES: Record<string, string> = {
  suburb: 'quartiere', quarter: 'quartiere', neighbourhood: 'quartiere', village: 'paese', town: 'cittadina', city: 'città',
  municipality: 'comune', county: 'provincia', province: 'provincia', state: 'regione', region: 'regione', country: 'paese intero',
}
const RADII = [2, 5, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500]

async function search() {
  const q = query.value.trim()
  if (q.length < 2) return
  searching.value = true
  searchError.value = ''
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=it&q=${encodeURIComponent(q)}`)
    if (!res.ok) throw new Error()
    const items = await res.json() as {
      name: string, display_name: string, lat: string, lon: string, addresstype: string
      address?: { country_code?: string, country?: string, state?: string, county?: string }
    }[]
    found.value = items.map((i) => {
      // "Milano, Lombardia, Italia": nome, regione (o provincia) e paese, senza ripetizioni
      const parts = [i.name || i.display_name.split(', ')[0], i.address?.state ?? i.address?.county, i.address?.country]
      return {
        label: [...new Set(parts.filter(Boolean))].join(', '),
        lat: Math.round(Number(i.lat) * 1e4) / 1e4,
        lng: Math.round(Number(i.lon) * 1e4) / 1e4,
        km: KM_BY_KIND[i.addresstype] ?? 20,
        country: i.addresstype === 'country' ? i.address?.country_code?.toUpperCase() : undefined,
        kind: KIND_NAMES[i.addresstype] ?? i.addresstype,
      }
    })
    if (!found.value.length) searchError.value = 'Nessun risultato: prova con il nome della città'
  }
  catch {
    searchError.value = 'Ricerca non riuscita, riprova tra poco'
  }
  finally {
    searching.value = false
  }
}
function pick(f: Found) {
  // Un paese intero si aggiunge come paese, non come cerchio
  if (f.country) addCountry(f.country)
  else if (!t.value.places.some(p => p.label === f.label)) t.value.places = [...t.value.places, { label: f.label, lat: f.lat, lng: f.lng, km: f.km }]
  found.value = []
  query.value = ''
}
const removePlace = (i: number) => (t.value.places = t.value.places.filter((_, j) => j !== i))
const mapLink = (p: { lat: number, lng: number, km: number }) => {
  const zoom = p.km <= 5 ? 13 : p.km <= 20 ? 11 : p.km <= 75 ? 9 : 7
  return `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=${zoom}/${p.lat}/${p.lng}`
}

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v]
}
const toggleLang = (l: AdLang) => (t.value.languages = toggle(t.value.languages, l))
const toggleSpecies = (s: Species) => (t.value.species = toggle(t.value.species, s))
</script>

<template>
  <div class="admin-form ad-audience">
    <div class="admin-form__group">
      <span class="admin-form__label">Dove</span>
      <div class="admin-form__options" role="radiogroup" aria-label="Dove">
        <label class="admin-form__option" :class="{ 'is-active': !limited }"><input v-model="limited" type="radio" :value="false"> 🌍 Ovunque</label>
        <label class="admin-form__option" :class="{ 'is-active': limited }"><input v-model="limited" type="radio" :value="true"> 📍 Solo in certe zone</label>
      </div>

      <template v-if="limited">
        <div class="ad-audience__search">
          <input
            v-model="query" type="search" placeholder="Cerca una città, provincia o regione: Torino, Brianza, Toscana…"
            aria-label="Cerca un luogo" @keydown.enter.prevent="search"
          >
          <button type="button" class="ad-audience__go" :disabled="searching || query.trim().length < 2" @click="search">{{ searching ? 'Cerco…' : 'Cerca' }}</button>
        </div>
        <ul v-if="found.length" class="ad-audience__list">
          <li v-for="f in found" :key="`${f.lat},${f.lng}`">
            <button type="button" class="ad-audience__found" @click="pick(f)">
              <b class="ad-audience__found-name">{{ f.label }}</b>
              <small class="ad-audience__found-kind">{{ f.country ? 'Paese intero: si aggiunge ai paesi' : `${f.kind} · raggio proposto ${f.km} km` }}</small>
              <span class="ad-audience__found-add" aria-hidden="true">＋</span>
            </button>
          </li>
        </ul>
        <p v-if="searchError" class="admin-form__error">{{ searchError }}</p>

        <ul v-if="t.places.length" class="ad-audience__list">
          <li v-for="(p, i) in t.places" :key="p.label" class="ad-audience__place">
            <span aria-hidden="true">📍</span>
            <span class="ad-audience__place-name"><b>{{ p.label.split(',')[0] }}</b><small>{{ p.label.split(',').slice(1).join(',').trim() }}</small></span>
            <label class="ad-audience__radius">entro
              <select v-model.number="p.km" aria-label="Raggio in km" class="ad-audience__radius-select">
                <option v-for="r in RADII" :key="r" :value="r">{{ r }} km</option>
                <option v-if="!RADII.includes(p.km)" :value="p.km">{{ p.km }} km</option>
              </select>
            </label>
            <a :href="mapLink(p)" target="_blank" rel="noopener" class="ad-audience__map">mappa</a>
            <button type="button" class="ad-audience__remove" :aria-label="`Togli ${p.label}`" @click="removePlace(i)">✕</button>
          </li>
        </ul>

        <div class="ad-audience__countries">
          <span v-for="c in t.countries" :key="c" class="admin-form__option is-active ad-audience__country">
            {{ flag(c) }} {{ countryName(c) }}
            <button type="button" class="ad-audience__remove" :aria-label="`Togli ${countryName(c)}`" @click="removeCountry(c)">✕</button>
          </span>
          <select aria-label="Aggiungi un paese intero" class="ad-audience__add-country" :value="''" @change="addCountry(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''">
            <option value="" disabled>+ Paese intero…</option>
            <optgroup label="Vicini">
              <option v-for="c in near" :key="c.code" :value="c.code" :disabled="t.countries.includes(c.code)">{{ flag(c.code) }} {{ c.name }}</option>
            </optgroup>
            <optgroup label="Tutti">
              <option v-for="c in countries" :key="c.code" :value="c.code" :disabled="t.countries.includes(c.code)">{{ c.name }}</option>
            </optgroup>
          </select>
        </div>

        <label class="admin-form__check"><input v-model="t.unknownLocation" type="checkbox"> Mostrala anche a chi non sappiamo dove si trova</label>
        <small class="admin-form__hint">La posizione si ricava dall'indirizzo IP: è precisa più o meno alla città, per questo si sceglie un raggio. Chi è nella zona o in uno dei paesi la vede.</small>
      </template>
    </div>

    <div class="admin-form__group">
      <span class="admin-form__label">Lingua del sito <em>nessuna scelta = tutte</em></span>
      <div class="admin-form__options">
        <button v-for="l in AD_LANGS" :key="l" type="button" class="admin-form__option" :class="{ 'is-active': t.languages.includes(l) }" :aria-pressed="t.languages.includes(l)" @click="toggleLang(l)">{{ LANG_NAMES[l] }}</button>
      </div>
      <small class="admin-form__hint">Utile se il testo dell'annuncio è in una lingua sola.</small>
    </div>

    <div class="admin-form__group">
      <span class="admin-form__label">Specie <em>nessuna scelta = tutte</em></span>
      <div class="admin-form__options">
        <button v-for="s in SPECIES" :key="s" type="button" class="admin-form__option" :class="{ 'is-active': t.species.includes(s) }" :aria-pressed="t.species.includes(s)" @click="toggleSpecies(s)">
          {{ SPECIES_EMOJI[s] }} {{ $t(`species.${s}.many`) }}
        </button>
      </div>
      <small class="admin-form__hint">Compare quando chi vota filtra queste specie, e nei duelli con tutte le specie.</small>
    </div>

    <div class="admin-form__group">
      <span class="admin-form__label">A chi</span>
      <div class="admin-form__options" role="radiogroup" aria-label="A chi">
        <label class="admin-form__option" :class="{ 'is-active': t.audience === 'all' }"><input v-model="t.audience" type="radio" value="all"> Tutti</label>
        <label class="admin-form__option" :class="{ 'is-active': t.audience === 'users' }"><input v-model="t.audience" type="radio" value="users"> Utenti registrati</label>
        <label class="admin-form__option" :class="{ 'is-active': t.audience === 'guests' }"><input v-model="t.audience" type="radio" value="guests"> Ospiti</label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Molecola: dove, in che lingua, per quali specie e a chi esce una campagna
.ad-audience {
  &__search {
    display: flex;
    gap: $space-3;

    input { flex: 1; }
  }

  &__go {
    border: 0;
    @include pill(0, 18px);
    background: var(--ink);
    color: var(--bg);
    font-weight: 800;
    cursor: pointer;
    flex-shrink: 0;

    &:disabled { opacity: .5; cursor: default; }
  }

  &__list { list-style: none; margin: 0; padding: 0; @include stack($space-2); }

  &__found {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    column-gap: $space-4;
    text-align: left;
    border: 2px dashed var(--line);
    background: var(--bg);
    color: var(--ink);
    border-radius: $radius-sm;
    padding: 8px 12px;
    cursor: pointer;

    &:hover { border-color: var(--coral); }
  }

  &__found-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__found-kind { font-size: 12px; color: var(--muted); grid-row: 2; }

  &__found-add { grid-row: 1 / 3; grid-column: 2; align-self: center; font-size: 18px; color: var(--coral); }

  &__place {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
    background: var(--bg);
    border-radius: $radius-sm;
    padding: 8px 10px;
    border: 2px solid color-mix(in srgb, var(--coral) 40%, var(--line));
  }

  &__place-name {
    flex: 1;
    min-width: 140px;
    display: flex;
    flex-direction: column;

    b { font-size: 14px; }

    small { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }

  // Più specifico delle regole generali di .admin-form
  .admin-form &__radius { flex-direction: row; align-items: center; gap: $space-2; font-size: 12px; color: var(--muted); }

  .admin-form &__radius-select { width: auto; padding: 6px 8px; }

  &__map { font-size: 12px; font-weight: 800; color: var(--coral-deep); }

  &__remove { border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 2px 4px; }

  &__countries { @include cluster($space-2); align-items: center; }

  .admin-form &__country { cursor: default; padding-right: 6px; }

  .admin-form &__add-country { width: auto; min-width: 180px; }
}
</style>
