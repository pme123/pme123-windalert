<template>
  <AlertBanner />

  <div class="app-wrap">
    <AppHeader @open-log="showLog = true" @open-settings="showSettings = true" />
    <TabBar
      :map-active="showMap"
      @map-clicked="showMap = true"
      @tab-changed="onTabChanged"
      @station-added="onStationAdded"
    />

    <MapOverview v-if="showMap" @open-station="showMap = false" />

    <StationPanel v-else />
  </div>

  <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
    <div class="modal-box">
      <div class="modal-header">
        <span>Einstellungen</span>
        <button class="modal-close" @click="showSettings = false">✕</button>
      </div>
      <div class="modal-body">
        <SettingsCard />
      </div>
    </div>
  </div>

  <div v-if="showLog" class="modal-overlay" @click.self="showLog = false">
    <div class="modal-box">
      <div class="modal-header">
        <span>Protokoll</span>
        <button class="modal-close" @click="showLog = false">✕</button>
      </div>
      <div class="modal-body">
        <LogCard />
      </div>
    </div>
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
const showSettings  = ref(false)
const showLog       = ref(false)

onMounted(async () => {
  await configStore.initFolderSync()
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
