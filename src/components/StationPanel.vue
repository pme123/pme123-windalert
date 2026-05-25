<template>
  <div class="station-panel">
    <div class="panel-grid">
      <WindCard />
      <CompassCard />
      <ChartCard />
      <ThresholdsCard />
      <StationSelector />
    </div>
  </div>
</template>

<script setup lang="ts">
import WindCard        from './WindCard.vue'
import CompassCard     from './CompassCard.vue'
import ChartCard       from './ChartCard.vue'
import ThresholdsCard  from './ThresholdsCard.vue'
import StationSelector from './StationSelector.vue'
</script>
