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
      <a href="https://pme123.github.io/pme123-windspotter/" target="_blank" rel="noopener" class="nav-link">{{ t('header.windspotter') }}</a>
      <a href="https://pme123.github.io/pme123-weather/" target="_blank" rel="noopener" class="nav-link">{{ t('header.weatherAnalysis') }}</a>
      <a href="https://github.com/pme123/pme123-windalert" target="_blank" rel="noopener" class="nav-link nav-link-icon" aria-label="GitHub">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </a>
      <span class="nav-separator"></span>
      <div class="header-status">
        <span class="countdown">{{ stationsStore.countdown }}</span>
        <span class="badge" :class="badgeClass">
          <span class="dot"></span> {{ badgeLabel }}
        </span>
      </div>
      <span class="nav-separator"></span>
      <button class="icon-btn" :data-tip="t('header.log')" @click="emit('open-log')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
          <path d="M14 4v4a1 1 0 0 0 1 1h4"></path>
          <path d="M9 13h6"></path>
          <path d="M9 17h6"></path>
        </svg>
      </button>
      <button class="icon-btn" :data-tip="t('header.settings')" @click="emit('open-settings')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStationsStore } from '../stores/stations'

const emit = defineEmits<{
  (e: 'open-log'): void
  (e: 'open-settings'): void
}>()

const { t }         = useI18n()
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
  if (s === 'warn') return t('header.statusWarn')
  if (s === 'err')  return t('header.statusErr')
  if (s === 'ok')   return t('header.statusLive')
  return t('header.statusOffline')
})
</script>
