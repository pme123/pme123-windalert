<template>
  <div
    class="alert-banner"
    :class="{ visible: stationsStore.bannerVisible }"
    @click="stationsStore.dismissBanner()"
  >
    ⚠️ <span>{{ stationsStore.bannerText }}</span> &nbsp;·&nbsp; <small>{{ t('banner.closeHint') }}</small>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useStationsStore } from '../stores/stations'

const { t } = useI18n()
const stationsStore = useStationsStore()
</script>
