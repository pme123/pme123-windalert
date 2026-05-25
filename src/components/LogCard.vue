<template>
  <div class="bottom-card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span>Protokoll</span>
      <button class="btn-secondary" style="padding:3px 10px;font-size:.7rem" @click="stationsStore.clearLog()">Löschen</button>
    </div>
    <div class="log">
      <div
        v-for="entry in stationsStore.log"
        :key="entry.id"
        class="log-entry"
        :class="entry.type"
      >
        <span class="log-t">{{ entry.time }}</span>
        <span>{{ entry.msg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStationsStore } from '../stores/stations'

const stationsStore = useStationsStore()
</script>
