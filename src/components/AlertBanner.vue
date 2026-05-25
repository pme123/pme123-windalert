<template>
  <div
    class="alert-banner"
    :class="{ visible: stationsStore.bannerVisible }"
    @click="stationsStore.dismissBanner()"
  >
    ⚠️ <span>{{ stationsStore.bannerText }}</span> &nbsp;·&nbsp; <small>klicken zum Schliessen</small>
  </div>
</template>

<script setup lang="ts">
import { useStationsStore } from '../stores/stations'

const stationsStore = useStationsStore()
</script>
