<template>
  <div class="bottom-card">
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn-secondary" style="padding:3px 10px;font-size:.7rem" @click="stationsStore.clearLog()">{{ t('log.clear') }}</button>
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
import { useI18n } from 'vue-i18n'
import { useStationsStore } from '../stores/stations'

const { t } = useI18n()
const stationsStore = useStationsStore()
</script>
