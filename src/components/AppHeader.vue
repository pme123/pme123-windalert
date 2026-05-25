<template>
  <div class="header">
    <a href="https://z9nai.ch" target="_blank" rel="noopener" class="z9-brand-link">
      <div class="z9-logo-wrap">
        <img src="https://z9nai.ch/assets/logo_new-DwOlNuuy.png"       alt="z9nai" class="z9-logo-color">
        <img src="https://z9nai.ch/assets/logo_new_white-BXK2S0Ym.png" alt="z9nai" class="z9-logo-white">
      </div>
      <h1>Wind Alert</h1>
      <div class="z9-byline">by z9nai GmbH</div>
    </a>
    <div class="header-right">
      <span class="countdown">{{ stationsStore.countdown }}</span>
      <span class="badge" :class="badgeClass">
        <span class="dot"></span> {{ badgeLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStationsStore } from '../stores/stations'

const stationsStore = useStationsStore()

const activeStatus = computed(() => stationsStore.activeStation?.status ?? 'off')

const badgeClass = computed(() => {
  const s = activeStatus.value
  if (s === 'warn') return 'badge badge-warn'
  if (s === 'err')  return 'badge badge-err'
  if (s === 'ok')   return 'badge badge-ok'
  return 'badge badge-off'
})

const badgeLabel = computed(() => {
  const s = activeStatus.value
  if (s === 'warn') return 'Alert!'
  if (s === 'err')  return 'Fehler'
  if (s === 'ok')   return 'Live'
  return 'Offline'
})
</script>
