<template>
  <div class="card">
    <div class="card-title">{{ t('thresholds.title') }}</div>

    <!-- Avg threshold -->
    <div class="thresh-row">
      <span class="lbl">{{ t('thresholds.avgWind') }}</span>
      <label class="toggle">
        <input type="checkbox" :checked="station?.tAvgOn" @change="onAvgOnChange" />
        <span class="slider"></span>
      </label>
      <div class="inline">
        <input
          type="number"
          :value="fmtThresh(station?.tAvg ?? 20)"
          min="0" max="999" step="1"
          @change="onAvgChange"
        />
        <span class="suffix">{{ unitLabel() }}</span>
      </div>
    </div>

    <!-- Max threshold -->
    <div class="thresh-row">
      <span class="lbl">{{ t('thresholds.maxGusts') }}</span>
      <label class="toggle">
        <input type="checkbox" :checked="station?.tMaxOn" @change="onMaxOnChange" />
        <span class="slider"></span>
      </label>
      <div class="inline">
        <input
          type="number"
          :value="fmtThresh(station?.tMax ?? 40)"
          min="0" max="999" step="1"
          @change="onMaxChange"
        />
        <span class="suffix">{{ unitLabel() }}</span>
      </div>
    </div>

    <!-- Notifications -->
    <div class="field" style="margin-top:16px">
      <label style="margin-bottom:8px">{{ t('thresholds.notifications') }}</label>
      <div class="notif-row">
        <span>{{ t('thresholds.whatsappAlert') }}</span>
        <label class="toggle">
          <input type="checkbox" :checked="station?.waOn" @change="onWaOnChange" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="notif-row">
        <span>{{ t('thresholds.browserDialog') }}</span>
        <label class="toggle">
          <input type="checkbox" v-model="configStore.nDialog" @change="configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="notif-row">
        <span>{{ t('thresholds.soundAlert') }}</span>
        <label class="toggle">
          <input type="checkbox" v-model="configStore.nSound" @change="configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="notif-row">
        <span>{{ t('thresholds.bannerTop') }}</span>
        <label class="toggle">
          <input type="checkbox" v-model="configStore.nBanner" @change="configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="notif-row">
        <span>{{ t('thresholds.browserNotification') }}</span>
        <label class="toggle">
          <input type="checkbox" v-model="configStore.nNotif" @change="onNotifChange" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Cooldown -->
    <div class="field">
      <label>{{ t('thresholds.alertPause') }}</label>
      <input
        type="number"
        :value="configStore.cd"
        min="1" max="1440"
        @change="e => { configStore.cd = +(e.target as HTMLInputElement).value; configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx) }"
      />
    </div>

    <!-- Interval -->
    <div class="field">
      <label>{{ t('thresholds.pollInterval') }}</label>
      <select
        :value="configStore.iv"
        @change="onIntervalChange"
      >
        <option value="60000">{{ t('thresholds.min1') }}</option>
        <option value="180000">{{ t('thresholds.min3') }}</option>
        <option value="300000">{{ t('thresholds.min5') }}</option>
        <option value="600000">{{ t('thresholds.min10') }}</option>
        <option value="900000">{{ t('thresholds.min15') }}</option>
      </select>
    </div>

    <button class="btn-secondary btn-block" style="margin-top:4px" @click="stationsStore.testAllAlerts()">{{ t('thresholds.testAll') }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '../stores/config'
import { useStationsStore } from '../stores/stations'
import { useUnits } from '../composables/useUnits'

const { t }         = useI18n()
const configStore   = useConfigStore()
const stationsStore = useStationsStore()
const { fmtThresh, unitLabel, unitToKmh } = useUnits()

const station = computed(() => stationsStore.activeStation)

function save() {
  stationsStore.saveConfig()
}

function onAvgOnChange(e: Event) {
  const s = station.value
  if (!s) return
  s.tAvgOn = (e.target as HTMLInputElement).checked
  save()
}

function onMaxOnChange(e: Event) {
  const s = station.value
  if (!s) return
  s.tMaxOn = (e.target as HTMLInputElement).checked
  save()
}

function onWaOnChange(e: Event) {
  const s = station.value
  if (!s) return
  s.waOn = (e.target as HTMLInputElement).checked
  save()
}

function onAvgChange(e: Event) {
  const s = station.value
  if (!s) return
  const v = unitToKmh((e.target as HTMLInputElement).value)
  if (v != null) s.tAvg = v
  save()
}

function onMaxChange(e: Event) {
  const s = station.value
  if (!s) return
  const v = unitToKmh((e.target as HTMLInputElement).value)
  if (v != null) s.tMax = v
  save()
}

function onNotifChange() {
  configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)
  stationsStore.maybeRequestNotif()
}

function onIntervalChange(e: Event) {
  configStore.iv = +(e.target as HTMLSelectElement).value
  configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)
  stationsStore.restartPolling()
}
</script>
