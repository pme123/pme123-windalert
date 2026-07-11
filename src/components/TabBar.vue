<template>
  <div class="tabs">
    <button class="tab tab-map" :class="{ active: mapActive }" @click="handleMapClick">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
      {{ t('tabs.map') }}
    </button>
    <button
      v-for="(s, i) in stationsStore.stations"
      :key="i"
      class="tab"
      :class="{ active: !mapActive && i === stationsStore.activeIdx }"
      @click="handleTabClick(i)"
    >
      <span class="tab-dot" :class="s.status"></span>
      <span class="tab-name">{{ s.name || (s.id ? t('tabs.stationPrefix', { id: s.id }) : t('tabs.newStation')) }}</span>
      <span
        v-if="stationsStore.stations.length > 1"
        class="tab-close"
        :title="t('tabs.remove')"
        @click.stop="stationsStore.removeStation(i)"
      >✕</span>
    </button>
    <button class="tab-add" @click="handleAdd">{{ t('tabs.addStation') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useStationsStore } from '../stores/stations'

const { t } = useI18n()
defineProps<{ mapActive: boolean }>()

const emit = defineEmits<{
  (e: 'tab-changed', idx: number): void
  (e: 'station-added'): void
  (e: 'map-clicked'): void
}>()

const stationsStore = useStationsStore()

function handleMapClick() {
  emit('map-clicked')
}

function handleTabClick(idx: number) {
  stationsStore.switchTab(idx)
  emit('tab-changed', idx)
}

function handleAdd() {
  stationsStore.addStation()
  emit('station-added')
}
</script>
