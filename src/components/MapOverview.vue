<template>
  <div class="map-overview-wrap">
    <div ref="mapEl" class="map-overview-el"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import type { Map as LMap } from 'leaflet'
import { useStationsStore } from '../stores/stations'
import { fetchMSWMeta, getMswMetaArr } from '../services/meteoswiss'
import type { MSWStationMeta } from '../types'

const mapEl         = ref<HTMLElement | null>(null)
const stationsStore = useStationsStore()

let leafletMap: LMap | null = null
const markerLayer = L.layerGroup()

// --- Color scale by wind speed (km/h) ---
function windColor(kmh: number | null): string {
  if (kmh == null) return '#64748b'
  if (kmh <  12)  return '#cccccc'
  if (kmh <  24)  return '#44cc00'
  if (kmh <  36)  return '#88cc00'
  if (kmh <  48)  return '#cccc00'
  if (kmh <  60)  return '#cc8800'
  if (kmh <  72)  return '#cc3300'
  if (kmh <  84)  return '#cc0000'
  if (kmh <  96)  return '#c0003c'
  if (kmh < 108)  return '#e0006e'
  return '#cc00cc'
}

// Arrow icon — pointing in wind direction (to direction, i.e. heading+180)
function arrowIcon(heading: number, speed: number | null, isOpen: boolean, highlight: boolean) {
  const color  = windColor(speed)
  const rotate = (heading + 180) % 360
  const border = highlight ? `box-shadow:0 0 0 3px ${color},0 0 8px ${color};` : ''
  const html = `
    <div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 16 16" style="transform:rotate(${rotate}deg)">
        <polygon points="8,1 13,13 8,10 3,13" fill="${color}" stroke="#1e293b" stroke-width="1" stroke-linejoin="round"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
}

function greyDotIcon(variant: 'static' | 'open' | 'open-active' = 'static') {
  const styles: Record<string, string> = {
    'static':      'width:10px;height:10px;background:#94a3b8;border:1.5px solid #cbd5e1;',
    'open':        'width:10px;height:10px;background:#1e293b;border:1.5px solid #334155;',
    'open-active': 'width:10px;height:10px;background:#1e293b;border:1.5px solid #334155;',
  }
  const s    = styles[variant]
  const html = `<div style="border-radius:50%;${s}"></div>`
  return L.divIcon({ html, className: '', iconSize: [10, 10], iconAnchor: [5, 5] })
}

// Build tooltip HTML
function tipHtml(name: string, speed: number | null, gust: number | null, dir: number | null, source: string): string {
  const dirStr  = dir != null ? `${dir}°` : '—'
  const spdStr  = speed != null ? `${speed.toFixed(0)} km/h` : '—'
  const gustStr = gust  != null ? `${gust.toFixed(0)} km/h`  : '—'
  const badge   = `<span style="font-size:.68rem;opacity:.6;margin-left:4px">${source}</span>`
  return `
    <div style="font-size:.82rem;line-height:1.5;min-width:140px">
      <b>${name}</b>${badge}<br>
      Ø ${spdStr} · Böe ${gustStr} · ${dirStr}
    </div>`
}

// All static station lists (grey dots) — loaded lazily in the background,
// cached across visits so re-opening the map doesn't refetch/reparse them.
let mswStations: MSWStationMeta[] = []

async function loadStaticStations() {
  await Promise.allSettled([
    fetchMSWMeta(),
    stationsStore.loadOWMStations(),
  ])
  mswStations = getMswMetaArr()
  renderMarkers()
}

function renderMarkers() {
  if (!leafletMap) return
  markerLayer.clearLayers()

  const openPiou = new Set(
    stationsStore.stations.filter(s => s.source === 'pioupiou').map(s => s.id)
  )
  const openMsw = new Set(
    stationsStore.stations.filter(s => s.source === 'meteoswiss').map(s => s.id)
  )

  // --- MeteoSwiss stations ---
  for (const st of mswStations) {
    if (!st.lat || !st.lon) continue
    const isOpen = openMsw.has(st.abbr)
    if (isOpen) continue  // drawn below with live data
    const m = L.marker([st.lat, st.lon], { icon: greyDotIcon('static') })
    m.bindTooltip(`<b>${st.name}</b> <span style="font-size:.68rem;opacity:.6">MeteoSwiss</span>`, { direction: 'top' })
    m.on('click', () => {
      stationsStore.openStationInNewTab(st.abbr, st.name, 'meteoswiss')
      emit('open-station')
    })
    markerLayer.addLayer(m)
  }

  // --- Pioupiou stations ---
  for (const st of stationsStore.owmStations) {
    if (!st.location?.latitude || !st.location?.longitude) continue
    const sid    = String(st.id)
    const isOpen = openPiou.has(sid)
    if (isOpen) continue  // drawn below with live data
    const m = L.marker([st.location.latitude, st.location.longitude], { icon: greyDotIcon('static') })
    m.bindTooltip(`<b>${st.meta.name}</b> <span style="font-size:.68rem;opacity:.6">Pioupiou</span>`, { direction: 'top' })
    m.on('click', () => {
      stationsStore.openStationInNewTab(sid, st.meta.name, 'pioupiou')
      emit('open-station')
    })
    markerLayer.addLayer(m)
  }

  // --- Open stations with live data ---
  for (let i = 0; i < stationsStore.stations.length; i++) {
    const s    = stationsStore.stations[i]
    const d    = s.lastData?.measurements
    const loc  = s.lastData?.location
    const lat  = loc?.latitude
    const lon  = loc?.longitude

    // Fallback to meta for MeteoSwiss
    let finalLat = lat
    let finalLon = lon
    if (s.source === 'meteoswiss' && (!lat || !lon)) {
      const meta = getMswMetaArr().find(m => m.abbr === s.id)
      if (meta) { finalLat = meta.lat; finalLon = meta.lon }
    }
    if (!finalLat || !finalLon) continue

    const speed   = d?.wind_speed_avg ?? null
    const gust    = d?.wind_speed_max ?? null
    const heading = d?.wind_heading   ?? null
    const isActive = i === stationsStore.activeIdx

    const icon = (heading != null)
      ? arrowIcon(heading, speed, true, isActive)
      : greyDotIcon(isActive ? 'open-active' : 'open')

    const m = L.marker([finalLat, finalLon], { icon, zIndexOffset: 100 })
    m.bindTooltip(tipHtml(s.name || s.id, speed, gust, heading, s.source), { direction: 'top' })
    m.on('click', () => {
      stationsStore.switchTab(i)
      emit('open-station')
    })
    markerLayer.addLayer(m)
  }
}

const emit = defineEmits<{ (e: 'open-station'): void }>()

// Re-render when station data changes
watch(
  () => stationsStore.stations.map(s => `${s.id}:${s.lastData?.measurements?.wind_speed_avg}:${stationsStore.activeIdx}`),
  () => renderMarkers(),
  { deep: false }
)

onMounted(async () => {
  if (!mapEl.value) return
  leafletMap = L.map(mapEl.value, { zoomControl: true }).setView([46.82, 8.22], 8)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  }).addTo(leafletMap)
  markerLayer.addTo(leafletMap)
  // Show already-known live stations immediately (no network needed);
  // the large provider-wide station lists (grey dots) load in the background.
  renderMarkers()
  loadStaticStations()
})

onBeforeUnmount(() => {
  leafletMap?.remove()
  leafletMap = null
})
</script>
