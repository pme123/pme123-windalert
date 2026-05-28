<template>
  <div class="card span2">
    <div class="chart-header">
      <div class="card-title" style="margin:0">Verlauf</div>
      <div class="range-btns">
        <button
          v-for="h in [24, 48, 168]"
          :key="h"
          class="range-btn"
          :class="{ active: currentHours === h }"
          @click="changeRange(h)"
        >{{ h === 168 ? '7d' : h + 'h' }}</button>
      </div>
    </div>
    <div class="chart-wrap">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div class="ts" style="margin-top:8px;text-align:center">{{ chartStatus }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useStationsStore } from '../stores/stations'
import { useUnits } from '../composables/useUnits'
import type { ChartRow } from '../types'

Chart.register(...registerables)

const stationsStore = useStationsStore()
const { kmhToUnit, unitLabel, unit } = useUnits()

const canvasRef   = ref<HTMLCanvasElement | null>(null)
const chartStatus = ref('')
let windChart: Chart | null = null

const currentHours = ref(stationsStore.activeStation?.chartHours ?? 24)

function destroyChart() {
  if (windChart) { windChart.destroy(); windChart = null }
}

function renderChart(rows: ChartRow[], hours: number) {
  destroyChart()
  if (!canvasRef.value) return
  const labels  = rows.map(r => {
    const d = new Date(r[0])
    return hours <= 48
      ? d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('de-CH', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  })
  const minData = rows.map(r => kmhToUnit(r[3]))
  const avgData = rows.map(r => kmhToUnit(r[4]))
  const maxData = rows.map(r => kmhToUnit(r[5]))

  windChart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Max',    data: maxData, fill: '+1', backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.2)', borderWidth: 1, pointRadius: 0, tension: 0.3 } as never,
        { label: 'Min',    data: minData, fill: false, borderColor: 'rgba(56,189,248,0.12)', borderWidth: 1, pointRadius: 0, tension: 0.3 },
        { label: 'Ø Wind', data: avgData, fill: false, borderColor: '#38bdf8', borderWidth: 2, pointRadius: 0, tension: 0.3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1,
          titleColor: '#94a3b8', bodyColor: '#f1f5f9',
          callbacks: {
            label: ctx => {
              const y = ctx.parsed.y
              const ul = unitLabel()
              return `${ctx.dataset.label}: ${y == null ? '–' : unit.value === 'bft' ? Math.round(y) : y.toFixed(1)} ${ul}`
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: '#475569', maxTicksLimit: hours <= 48 ? 12 : 14, maxRotation: 0, font: { size: 10 } }, grid: { color: '#1e293b' } },
        y: { min: 0, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#334155' } },
      },
    },
  })
}

async function changeRange(hours: number) {
  currentHours.value = hours
  const s = stationsStore.activeStation
  if (!s) return

  if (s.source === 'wunderground') {
    destroyChart()
    chartStatus.value = 'Verlaufsdaten für Weather Underground-Stationen nicht verfügbar'
    return
  }

  chartStatus.value = 'Lade Verlaufsdaten…'
  destroyChart()
  await stationsStore.loadChartData(hours)
  const rows = stationsStore.activeStation?.chartRows
  if (rows) {
    renderChart(rows, hours)
    chartStatus.value = `${rows.length} Messpunkte`
  }
}

// Primary watch: fires immediately on setup AND whenever the active station or its ID changes.
// This correctly handles the case where ChartCard mounts before App.vue calls loadStations():
//   - immediate call: activeStation is null → skip
//   - after loadStations(): id becomes available → load + render
// Also handles tab switches and station ID changes in settings.
watch(
  () => [stationsStore.activeIdx, stationsStore.activeStation?.id] as const,
  async () => {
    const s = stationsStore.activeStation
    if (!s) { destroyChart(); chartStatus.value = ''; return }
    currentHours.value = s.chartHours ?? 24
    if (s.source === 'wunderground') {
      destroyChart()
      chartStatus.value = 'Verlaufsdaten für Weather Underground-Stationen nicht verfügbar'
      return
    }
    if (s.chartRows) {
      await nextTick() // ensure canvas is in the DOM (important for immediate call)
      renderChart(s.chartRows, s.chartHours ?? currentHours.value)
      chartStatus.value = `${s.chartRows.length} Messpunkte`
    } else if (s.id) {
      await changeRange(currentHours.value) // network request finishes after canvas is mounted
    }
  },
  { immediate: true }
)

// Re-render when unit changes
watch(
  () => unit.value,
  () => {
    const s = stationsStore.activeStation
    if (s?.chartRows) renderChart(s.chartRows, s.chartHours ?? currentHours.value)
  }
)

// Re-render when store updates chartRows in the background (15-min auto-refresh)
watch(
  () => stationsStore.activeStation?.chartRows,
  (rows) => {
    if (!rows || !rows.length) return
    renderChart(rows, currentHours.value)
    chartStatus.value = `${rows.length} Messpunkte`
  }
)

onBeforeUnmount(() => { destroyChart() })
</script>
