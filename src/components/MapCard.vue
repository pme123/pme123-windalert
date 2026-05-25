<template>
  <div v-show="visible" style="margin-top:14px">
    <div class="map-wrap">
      <div ref="mapEl" class="station-map-el"></div>
      <div v-if="loading" class="map-loading">
        <span class="map-spinner"></span>
        <span style="margin-left:8px;font-size:.8rem;color:#94a3b8">Karte wird geladen…</span>
      </div>
    </div>
    <div class="ts" style="margin-top:6px;text-align:center">{{ coordsText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import type { Map as LMap, Marker, TileLayer } from 'leaflet'

const props = defineProps<{
  lat: number | null
  lon: number | null
}>()

const mapEl   = ref<HTMLElement | null>(null)
const loading = ref(false)
let leafletMap: LMap      | null = null
let marker:     Marker    | null = null
let tileLayer:  TileLayer | null = null

const visible = computed(() => props.lat != null && props.lon != null)

const coordsText = computed(() => {
  if (props.lat == null || props.lon == null) return ''
  return `${props.lat.toFixed(5)}° N,  ${props.lon.toFixed(5)}° E`
})

function initMap(lat: number, lon: number) {
  if (!mapEl.value) return
  if (!leafletMap) {
    loading.value = true
    leafletMap = L.map(mapEl.value, { zoomControl: true }).setView([lat, lon], 10)
    tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(leafletMap)
    const done = () => { loading.value = false }
    tileLayer.once('load', done)
    setTimeout(done, 8000)   // fallback: hide spinner after 8s

    const smallIcon = L.icon({
      iconUrl:      'https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png',
      iconSize:     [16, 26], iconAnchor:   [8, 26], popupAnchor:  [0, -26],
      shadowUrl:    'https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png',
      shadowSize:   [26, 26], shadowAnchor: [8, 26],
    })
    marker = L.marker([lat, lon], { icon: smallIcon }).addTo(leafletMap)
  } else {
    leafletMap.setView([lat, lon], 13)
    marker?.setLatLng([lat, lon])
  }
  setTimeout(() => leafletMap?.invalidateSize(), 100)
}

// Watch lat/lon only — with v-show the container is always in the DOM,
// so leafletMap never gets a stale reference to a removed element.
watch(
  [() => props.lat, () => props.lon],
  async ([lat, lon]) => {
    if (lat == null || lon == null) return
    // nextTick ensures v-show has applied (display:none → visible)
    // before Leaflet measures the container dimensions.
    await nextTick()
    initMap(lat, lon)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null; marker = null; tileLayer = null }
})
</script>
