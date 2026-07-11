<template>
  <div class="card">
    <div class="card-title">{{ t('station.title') }}</div>

    <!-- Search -->
    <div class="field">
      <label>{{ t('station.searchLabel') }}</label>
      <div class="search-wrap" ref="searchWrap">
        <div class="search-row">
          <input
            type="text"
            :value="displayValue"
            :placeholder="t('station.searchPlaceholder')"
            autocomplete="off"
            @click="openDropdown"
            @input="e => { filterQuery = (e.target as HTMLInputElement).value; openDropdown() }"
          />
          <button class="search-btn" :title="t('station.allStations')" @click="openDropdown">🔍</button>
        </div>
        <div class="dropdown" :class="{ open: dropdownOpen }">
          <div class="dd-search">
            <input
              type="text"
              v-model="filterQuery"
              :placeholder="t('station.filterPlaceholder')"
              ref="filterInput"
              @keydown.escape="closeDropdown"
            />
          </div>
          <div class="dd-list">
            <div v-if="filteredList.length === 0" class="dd-empty">
              {{ stationsStore.owmLoaded ? t('station.noStationsFound') : t('station.loading') }}
            </div>
            <template v-else>
              <div
                v-for="item in filteredList"
                :key="itemKey(item)"
                class="dd-item"
                @click="selectItem(item)"
              >
                <!-- WU entry -->
                <template v-if="'_wu' in item && item._wu">
                  <div>
                    <div class="dd-name">{{ item.id }}</div>
                    <div class="dd-sub">{{ t('station.wuEntrySub') }}</div>
                  </div>
                  <div class="dd-badge wu">PWS</div>
                </template>

                <!-- MeteoSwiss entry -->
                <template v-else-if="'_msw' in item && item._msw">
                  <div>
                    <div class="dd-name">{{ item.name }}</div>
                    <div class="dd-sub">{{ item.abbr }} · {{ item.canton }}{{ item.elevation ? ` · ${item.elevation} m` : '' }}</div>
                  </div>
                  <div class="dd-badge msw">MSW</div>
                </template>

                <!-- Pioupiou entry -->
                <template v-else>
                  <div>
                    <div class="dd-name">{{ (item as PiouItem).meta.name }}</div>
                    <div class="dd-sub">
                      ID {{ (item as PiouItem).id }} ·
                      {{ (item as PiouItem).location?.latitude?.toFixed(2) }}°N
                      {{ (item as PiouItem).location?.longitude?.toFixed(2) }}°O
                      {{ ageStr(item as PiouItem) }}
                    </div>
                  </div>
                  <div class="dd-wind">
                    {{ (item as PiouItem).measurements?.wind_speed_avg != null
                        ? (item as PiouItem).measurements!.wind_speed_avg.toFixed(1)
                        : '–' }}
                    <span style="font-size:.68rem;color:var(--muted)">
                      / {{ (item as PiouItem).measurements?.wind_speed_max != null
                           ? (item as PiouItem).measurements!.wind_speed_max.toFixed(1)
                           : '–' }} km/h
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Holfuy manual entry -->
    <div class="field">
      <label style="display:flex;align-items:center;gap:6px">
        {{ t('station.holfuyConnectLabel') }}
        <InfoIcon>
          {{ t('station.holfuyInfo') }}
        </InfoIcon>
      </label>
      <div class="inline">
        <input type="text" v-model="holfuyId" :placeholder="t('station.holfuyIdPlaceholder')" style="flex:2" />
        <input type="text" v-model="holfuyPw" :placeholder="t('station.holfuyPwPlaceholder')" style="flex:2" />
        <button class="btn-secondary" :disabled="holfuyBusy" @click="connectHolfuy">
          {{ holfuyBusy ? t('station.connecting') : t('station.connect') }}
        </button>
      </div>
      <div v-if="holfuyError" class="holfuy-error">{{ holfuyError }}</div>
    </div>

    <!-- Tab name -->
    <div class="field">
      <label>{{ t('station.tabNameLabel') }}</label>
      <input
        type="text"
        :value="station?.name ?? ''"
        :placeholder="t('station.tabNamePlaceholder')"
        @change="onNameChange"
      />
    </div>

    <button class="btn-primary btn-block" style="margin-top:4px" @click="fetchNow">{{ t('station.loadNow') }}</button>

    <!-- Map -->
    <MapCard :lat="mapLat" :lon="mapLon" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStationsStore } from '../stores/stations'
import { useConfigStore } from '../stores/config'
import { getMswMetaArr } from '../services/meteoswiss'
import type { OWMStation, MSWStationMeta } from '../types'
import MapCard from './MapCard.vue'
import InfoIcon from './InfoIcon.vue'

const { t }         = useI18n()
const stationsStore = useStationsStore()
const configStore   = useConfigStore()

type PiouItem = OWMStation
type MSWItem  = MSWStationMeta & { _msw: true }
type WUItem   = { _wu: true; id: string }
type ListItem = PiouItem | MSWItem | WUItem

const dropdownOpen = ref(false)
const filterQuery  = ref('')
const filterInput  = ref<HTMLInputElement | null>(null)
const searchWrap   = ref<HTMLElement | null>(null)

const station = computed(() => stationsStore.activeStation)

const displayValue = computed(() => {
  const s = station.value
  if (!s?.id) return ''
  if (s.name) return `${s.name} (${s.id})`
  return `Station ${s.id}`
})

const mapLat = computed(() => {
  const loc = station.value?.lastData?.location
  if (!loc?.success || loc.latitude == null) return null
  return loc.latitude
})
const mapLon = computed(() => {
  const loc = station.value?.lastData?.location
  if (!loc?.success || loc.longitude == null) return null
  return loc.longitude
})

const filteredList = computed((): ListItem[] => {
  const raw = filterQuery.value.trim()
  const ql  = raw.toLowerCase()
  const piouAll = stationsStore.owmStations as unknown as OWMStation[]

  const piou: PiouItem[] = ql
    ? piouAll.filter(s =>
        s.meta.name.toLowerCase().includes(ql) ||
        String(s.id).includes(ql) ||
        ((s.location?.latitude?.toFixed(2) ?? '') + ' ' + (s.location?.longitude?.toFixed(2) ?? '')).includes(ql))
    : piouAll

  const mswArr = getMswMetaArr()
  const msw: MSWItem[] = mswArr.length
    ? (ql
        ? mswArr.filter(s =>
            s.name.toLowerCase().includes(ql) ||
            s.abbr.toLowerCase().includes(ql) ||
            s.canton.toLowerCase().includes(ql))
        : mswArr
      ).map(s => ({ ...s, _msw: true as const }))
    : []

  const combined: ListItem[] = [...piou, ...msw]

  // WU: if key set and input looks like a station ID
  if (configStore.wuKey && /^[A-Z0-9]{4,15}$/i.test(raw)) {
    combined.push({ _wu: true, id: raw.toUpperCase() })
  }

  return combined.slice(0, 81)
})

function itemKey(item: ListItem): string {
  if ('_wu' in item && item._wu) return `wu-${item.id}`
  if ('_msw' in item && item._msw) return `msw-${(item as MSWItem).abbr}`
  return `pp-${(item as PiouItem).id}`
}

function ageStr(s: PiouItem): string {
  if (!s.measurements?.date) return ''
  const age = Math.round((Date.now() - new Date(s.measurements.date).getTime()) / 60000)
  return age < 2 ? `· ${t('station.now')}` : `· ${t('station.minAgo', { n: age })}`
}

async function openDropdown() {
  dropdownOpen.value = true
  await stationsStore.loadOWMStations()
  await nextTick()
  filterInput.value?.focus()
}

function closeDropdown() {
  dropdownOpen.value = false
}

function selectItem(item: ListItem) {
  closeDropdown()
  if ('_wu' in item && item._wu) {
    stationsStore.selectWUFromSearch(item.id)
    return
  }
  if ('_msw' in item && item._msw) {
    const m = item as MSWItem
    stationsStore.selectMSWStation(m.abbr, m.name)
    return
  }
  const p = item as PiouItem
  stationsStore.selectOWM(p.id, p.meta.name)
}

function onNameChange(e: Event) {
  const s = station.value
  if (!s) return
  s.name = (e.target as HTMLInputElement).value.trim()
  stationsStore.saveConfig()
}

async function fetchNow() {
  const s = station.value
  if (!s?.id) {
    stationsStore.addLog('warn', t('logMsg.noStationId'))
    return
  }
  await stationsStore.fetchStation(stationsStore.activeIdx)
}

const holfuyId    = ref('')
const holfuyPw    = ref('')
const holfuyBusy  = ref(false)
const holfuyError = ref('')

async function connectHolfuy() {
  holfuyError.value = ''
  if (!holfuyId.value.trim()) {
    holfuyError.value = t('logMsg.holfuyIdRequired')
    return
  }
  holfuyBusy.value = true
  try {
    const err = await stationsStore.selectHolfuyStation(holfuyId.value.trim(), holfuyPw.value.trim())
    if (err) {
      holfuyError.value = err
    } else {
      holfuyId.value = ''
      holfuyPw.value = ''
    }
  } finally {
    holfuyBusy.value = false
  }
}

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  if (searchWrap.value && !searchWrap.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

// Watch activeIdx to reset filter
watch(() => stationsStore.activeIdx, () => {
  filterQuery.value  = ''
  dropdownOpen.value = false
})
</script>
