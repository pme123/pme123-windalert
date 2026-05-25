<template>
  <div class="card" :class="{ 'card-alert': isAlert }">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div class="card-title" style="margin:0">Aktuell</div>
      <div class="unit-btns">
        <button class="unit-btn" :class="{ active: configStore.unit === 'kn' }"  @click="switchUnit('kn')">kn</button>
        <button class="unit-btn" :class="{ active: configStore.unit === 'kmh' }" @click="switchUnit('kmh')">km/h</button>
        <button class="unit-btn" :class="{ active: configStore.unit === 'bft' }" @click="switchUnit('bft')">Bft</button>
      </div>
    </div>
    <a
      :href="owmHref"
      target="_blank"
      rel="noopener"
      style="font-size:.72rem;color:var(--accent);text-decoration:none;display:block;margin-bottom:8px"
    >{{ owmLabel }}</a>
    <div class="wind-main">
      <span class="wind-big">{{ fmtWind(m?.wind_speed_avg ?? null) }}</span>
      <span class="wind-unit">{{ unitLabel() }}</span>
    </div>
    <div class="wind-stats">
      <div class="stat">
        <div class="stat-lbl">Min</div>
        <div class="stat-val">{{ fmtWind(m?.wind_speed_min ?? null) }}</div>
      </div>
      <div class="stat">
        <div class="stat-lbl">Böen</div>
        <div class="stat-val" style="color:var(--orange)">{{ fmtWind(m?.wind_speed_max ?? null) }}</div>
      </div>
      <div class="stat">
        <div class="stat-lbl">Richtung</div>
        <div class="stat-val">{{ dirStr }}</div>
      </div>
    </div>
    <div class="ts">{{ tsStr }}</div>
    <div class="ts" style="margin-top:2px">{{ fetchedStr }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '../stores/config'
import { useStationsStore } from '../stores/stations'
import { useUnits } from '../composables/useUnits'
import type { WindUnit } from '../types'

const configStore   = useConfigStore()
const stationsStore = useStationsStore()
const { fmtWind, unitLabel } = useUnits()

const DIRS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW']
function dirLabel(deg: number) { return DIRS[Math.round(deg / 22.5) % 16] }

const station = computed(() => stationsStore.activeStation)
const m       = computed(() => station.value?.lastData?.measurements ?? null)
const isAlert = computed(() => station.value?.status === 'warn')

const dirStr = computed(() => {
  const deg = m.value?.wind_heading
  return deg != null ? dirLabel(deg) : '–'
})

const tsStr = computed(() => {
  const date = m.value?.date
  if (!date) return 'Noch keine Daten'
  const d   = new Date(date)
  const age = Math.round((Date.now() - d.getTime()) / 60000)
  return `Sensor: ${d.toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})} (${age < 2 ? 'gerade eben' : `vor ${age} Min`})`
})

const fetchedStr = computed(() => {
  if (!m.value?.date) return ''
  return `App-Abfrage: ${new Date().toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`
})

const owmHref = computed(() => {
  const s = station.value
  if (!s?.id) return '#'
  if (s.source === 'meteoswiss')
    return `https://www.meteoswiss.admin.ch/services-and-publications/applications/measurement-values-and-measuring-networks.html#param=messnetz-automatisch&station=${s.id}`
  if (s.source === 'wunderground')
    return `https://www.wunderground.com/dashboard/pws/${s.id}`
  return `https://www.openwindmap.org/windbird-${s.id}`
})

const owmLabel = computed(() => {
  const s = station.value
  if (!s?.id) return 'openwindmap.org'
  if (s.source === 'meteoswiss') {
    const { getMswMeta } = stationsStore
    const meta = getMswMeta()?.get(s.id)
    const elev = meta?.elevation ? ` · ${meta.elevation} m ü.M.` : ''
    return `MeteoSwiss ${s.id}${elev}`
  }
  if (s.source === 'wunderground') return `wunderground.com/pws/${s.id}`
  return `openwindmap.org/windbird-${s.id}`
})

function switchUnit(u: WindUnit) {
  // Save current station thresholds before switching unit
  stationsStore.saveConfig()
  configStore.unit = u
  stationsStore.saveConfig()
}
</script>
