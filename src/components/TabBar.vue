<template>
  <div class="tabs">
    <button
      v-for="(s, i) in stationsStore.stations"
      :key="i"
      class="tab"
      :class="{ active: i === stationsStore.activeIdx }"
      @click="handleTabClick(i)"
    >
      <span class="tab-dot" :class="s.status"></span>
      <span class="tab-name">{{ s.name || (s.id ? `Station ${s.id}` : 'Neu') }}</span>
      <span
        v-if="stationsStore.stations.length > 1"
        class="tab-close"
        title="Entfernen"
        @click.stop="stationsStore.removeStation(i)"
      >✕</span>
    </button>
    <button class="tab-add" @click="handleAdd">＋ Station</button>
  </div>
</template>

<script setup lang="ts">
import { useStationsStore } from '../stores/stations'

const emit = defineEmits<{
  (e: 'tab-changed', idx: number): void
  (e: 'station-added'): void
}>()

const stationsStore = useStationsStore()

function handleTabClick(idx: number) {
  stationsStore.switchTab(idx)
  emit('tab-changed', idx)
}

function handleAdd() {
  stationsStore.addStation()
  emit('station-added')
}
</script>
