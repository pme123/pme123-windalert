<template>
  <AlertBanner />

  <div class="app-wrap">
    <AppHeader />
    <TabBar
      :map-active="showMap"
      @map-clicked="showMap = true"
      @tab-changed="onTabChanged"
      @station-added="onStationAdded"
    />

    <MapOverview v-if="showMap" @open-station="showMap = false" />

    <template v-else>
      <StationPanel />
      <div class="bottom-grid">
        <SettingsCard />
        <LogCard />
      </div>
    </template>
  </div>

  <AppFooter />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from './stores/config'
import { useStationsStore } from './stores/stations'

import AlertBanner  from './components/AlertBanner.vue'
import AppHeader    from './components/AppHeader.vue'
import AppFooter    from './components/AppFooter.vue'
import TabBar       from './components/TabBar.vue'
import StationPanel from './components/StationPanel.vue'
import SettingsCard from './components/SettingsCard.vue'
import LogCard      from './components/LogCard.vue'
import MapOverview  from './components/MapOverview.vue'

const configStore   = useConfigStore()
const stationsStore = useStationsStore()
const showMap       = ref(true)

onMounted(async () => {
  configStore.loadConfig()
  stationsStore.loadStations()

  if ('Notification' in window && Notification.permission === 'default' && configStore.nNotif) {
    Notification.requestPermission()
  }

  stationsStore.restartPolling()
})

function onTabChanged(idx: number) {
  showMap.value = false
  const s = stationsStore.stations[idx]
  if (!s.chartRows && s.id && s.source === 'pioupiou') {
    stationsStore.loadChartData(s.chartHours ?? 24)
  }
}

function onStationAdded() {
  showMap.value = false
}
</script>
