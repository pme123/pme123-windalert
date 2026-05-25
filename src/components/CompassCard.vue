<template>
  <div class="card">
    <div class="card-title">Windrichtung</div>
    <div class="compass-wrap">
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#334155" stroke-width="1.5"/>
        <g stroke="#475569" stroke-width="1">
          <line x1="50" y1="6"  x2="50" y2="12"/>
          <line x1="50" y1="88" x2="50" y2="94"/>
          <line x1="6"  y1="50" x2="12" y2="50"/>
          <line x1="88" y1="50" x2="94" y2="50"/>
        </g>
        <text x="50" y="5"  text-anchor="middle" dominant-baseline="hanging" fill="#94a3b8" font-size="8" font-weight="700" font-family="sans-serif">N</text>
        <text x="50" y="95" text-anchor="middle" dominant-baseline="auto"    fill="#94a3b8" font-size="8" font-weight="700" font-family="sans-serif">S</text>
        <text x="96" y="50" text-anchor="middle" dominant-baseline="middle"  fill="#94a3b8" font-size="8" font-weight="700" font-family="sans-serif">O</text>
        <text x="4"  y="50" text-anchor="middle" dominant-baseline="middle"  fill="#94a3b8" font-size="8" font-weight="700" font-family="sans-serif">W</text>
        <g :transform="`rotate(${heading},50,50)`">
          <polygon points="50,14 46,50 54,50" fill="#f87171"/>
          <polygon points="50,86 46,50 54,50" fill="#475569"/>
          <circle cx="50" cy="50" r="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        </g>
      </svg>
      <div style="font-size:.82rem;color:var(--muted);text-align:center">{{ compassLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStationsStore } from '../stores/stations'

const DIRS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW']

const stationsStore = useStationsStore()
const m = computed(() => stationsStore.activeStation?.lastData?.measurements ?? null)

const heading = computed(() => m.value?.wind_heading ?? 0)
const compassLabel = computed(() => {
  const deg = m.value?.wind_heading
  if (deg == null) return '– –'
  const dir = DIRS[Math.round(deg / 22.5) % 16]
  return `${dir}  ${Math.round(deg)}°`
})
</script>
