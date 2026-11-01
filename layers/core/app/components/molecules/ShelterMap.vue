<script setup lang="ts">
import type { Map as LeafletMap, Marker } from 'leaflet'

/**
 * Mappa OpenStreetMap (Leaflet) con il segnaposto del rifugio. Solo nel browser.
 * Con `editable` un tocco sulla mappa (o il trascinamento del segnaposto) sposta il punto.
 * Senza coordinate mostra l'Italia, senza segnaposto.
 */
const props = defineProps<{ lat: number | null, lng: number | null, editable?: boolean, label?: string }>()
const emit = defineEmits<{ pick: [lat: number, lng: number] }>()

const { map: config } = useRuntimeConfig().public
const el = ref<HTMLElement>()
let map: LeafletMap | null = null
let marker: Marker | null = null
let L: typeof import('leaflet') | null = null

const ITALY: [number, number] = [42.5, 12.5]
const round = (n: number) => Math.round(n * 1e6) / 1e6

function place(lat: number | null, lng: number | null, fly = false) {
  if (!map || !L) return
  if (lat === null || lng === null) {
    marker?.remove()
    marker = null
    return
  }
  if (!marker) {
    // Segnaposto disegnato in CSS: le icone di Leaflet sono immagini che il bundle non trova
    const icon = L.divIcon({ className: 'shelter-pin', html: '<span><i>🏠</i></span>', iconSize: [40, 48], iconAnchor: [20, 46] })
    marker = L.marker([lat, lng], { icon, draggable: props.editable, keyboard: false, title: props.label })
      .addTo(map)
    marker.on('dragend', () => {
      const p = marker!.getLatLng()
      emit('pick', round(p.lat), round(p.lng))
    })
  }
  else marker.setLatLng([lat, lng])
  if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
}

onMounted(async () => {
  L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  if (!el.value) return
  const has = props.lat !== null && props.lng !== null
  map = L.map(el.value, {
    center: has ? [props.lat!, props.lng!] : ITALY,
    zoom: has ? 15 : 5,
    // Sulla pagina pubblica la mappa non "cattura" lo scorrimento: si zooma con i bottoni o due dita
    scrollWheelZoom: !!props.editable,
    dragging: !!props.editable || !L.Browser.mobile,
  })
  L.tileLayer(config.tiles, { maxZoom: 19, attribution: config.attribution }).addTo(map)
  if (props.editable) {
    map.on('click', e => emit('pick', round(e.latlng.lat), round(e.latlng.lng)))
  }
  place(props.lat, props.lng)
})

watch(() => [props.lat, props.lng] as const, ([lat, lng]) => place(lat, lng, true))

onBeforeUnmount(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div ref="el" class="shelter-map" :class="{ 'shelter-map--editable': editable }" role="application" :aria-label="label" />
</template>

<style lang="scss" scoped>
// Molecola: mappa OpenStreetMap con il segnaposto a forma di goccia
.shelter-map {
  width: 100%;
  height: 100%;
  min-height: 220px;
  border-radius: inherit;
  background: var(--line);
  z-index: 0;

  &--editable { cursor: crosshair; }

  // Elementi creati da Leaflet, fuori dal template
  :deep(.shelter-pin) { background: none; border: 0; }

  :deep(.shelter-pin span) {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    font-size: 20px;
    background: var(--accent, var(--coral));
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 6px 14px -4px rgba(0, 0, 0, .45);
  }

  :deep(.shelter-pin i) { font-style: normal; line-height: 1; transform: rotate(45deg); }

  :deep(.leaflet-control-attribution) { font-size: 10px; }

  :deep(.leaflet-control-attribution a) { color: #0b5ed7; }
}
</style>
