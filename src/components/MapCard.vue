<template>
  <div v-if="visible" style="margin-top:14px">
    <div ref="mapEl" class="station-map-el"></div>
    <div class="ts" style="margin-top:6px;text-align:center">{{ coordsText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import type { Map as LMap, Marker } from 'leaflet'

const props = defineProps<{
  lat: number | null
  lon: number | null
}>()

const mapEl    = ref<HTMLElement | null>(null)
let leafletMap: LMap | null = null
let marker:     Marker | null = null
let smallIcon:  L.Icon | null = null

const visible = computed(() => props.lat != null && props.lon != null)

const coordsText = computed(() => {
  if (props.lat == null || props.lon == null) return ''
  return `${props.lat.toFixed(5)}° N,  ${props.lon.toFixed(5)}° E`
})

function initMap(lat: number, lon: number) {
  if (!mapEl.value) return
  if (!leafletMap) {
    leafletMap = L.map(mapEl.value, { zoomControl: true }).setView([lat, lon], 10)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(leafletMap)
    smallIcon = L.icon({
      iconUrl:     'https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png',
      iconSize:    [16, 26],
      iconAnchor:  [8, 26],
      popupAnchor: [0, -26],
      shadowUrl:   'https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png',
      shadowSize:  [26, 26],
      shadowAnchor:[8, 26],
    })
    marker = L.marker([lat, lon], { icon: smallIcon }).addTo(leafletMap)
  } else {
    leafletMap.setView([lat, lon], 13)
    marker?.setLatLng([lat, lon])
  }
  setTimeout(() => leafletMap?.invalidateSize(), 50)
}

watch(
  [() => props.lat, () => props.lon, visible],
  async ([lat, lon, vis]) => {
    if (!vis || lat == null || lon == null) return
    // wait for DOM
    await new Promise(r => setTimeout(r, 30))
    initMap(lat, lon)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null; marker = null }
})
</script>
