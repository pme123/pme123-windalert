<template>
  <AlertBanner />

  <div class="app-wrap">
    <AppHeader />
    <TabBar @tab-changed="onTabChanged" @station-added="onStationAdded" />
    <StationPanel />

    <div class="bottom-grid">
      <SettingsCard />
      <LogCard />
    </div>
  </div>

  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConfigStore } from './stores/config'
import { useStationsStore } from './stores/stations'

import AlertBanner  from './components/AlertBanner.vue'
import AppHeader    from './components/AppHeader.vue'
import AppFooter    from './components/AppFooter.vue'
import TabBar       from './components/TabBar.vue'
import StationPanel from './components/StationPanel.vue'
import SettingsCard from './components/SettingsCard.vue'
import LogCard      from './components/LogCard.vue'

const configStore   = useConfigStore()
const stationsStore = useStationsStore()

onMounted(async () => {
  // Load config first (unit, phone, etc.)
  configStore.loadConfig()
  // Load stations from localStorage
  stationsStore.loadStations()

  // Request notification permission if needed
  if ('Notification' in window && Notification.permission === 'default' && configStore.nNotif) {
    Notification.requestPermission()
  }

  // Start polling
  stationsStore.restartPolling()
})

function onTabChanged(idx: number) {
  const s = stationsStore.stations[idx]
  // Load chart if not yet loaded for this tab
  if (!s.chartRows && s.id && s.source === 'pioupiou') {
    stationsStore.loadChartData(s.chartHours ?? 24)
  }
}

function onStationAdded() {
  // Focus handled inside StationSelector via watch
}
</script>
