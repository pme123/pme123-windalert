<template>
  <div class="bottom-card">
    <!-- WhatsApp -->
    <div class="settings-section-hd">
      {{ t('settings.whatsappTitle') }}
      <InfoIcon style="margin-left:auto">
        <strong>{{ t('settings.whatsappSetupTitle') }}</strong><br>
        <i18n-t keypath="settings.whatsappStep1" tag="span"><template #number><strong>+34 644 97 79 48</strong></template></i18n-t><br>
        <i18n-t keypath="settings.whatsappStep2" tag="span"><template #msg><em>I allow callmebot to send me messages</em></template></i18n-t><br>
        {{ t('settings.whatsappStep3') }}<br>
        <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener">{{ t('settings.whatsappGuideLink') }}</a>
        <hr>
        <strong>{{ t('settings.whatsappRateLimitTitle') }}</strong><br>
        <i18n-t keypath="settings.whatsappRateLimitText" tag="span"><template #limit><strong>16</strong></template></i18n-t><br>
        {{ t('settings.whatsappRateLimitRecommend') }}<br>
        {{ t('settings.whatsappRateLimitProblem') }}
      </InfoIcon>
    </div>
    <div class="field">
      <label>{{ t('settings.phoneLabel') }}</label>
      <input
        type="text"
        v-model="configStore.phone"
        placeholder="41791234567"
        @change="save"
      />
    </div>
    <div class="field">
      <label>{{ t('settings.apiKeyLabel') }}</label>
      <input
        type="text"
        v-model="configStore.key"
        :placeholder="t('settings.apiKeyPlaceholder')"
        @change="save"
      />
    </div>
    <button class="btn-secondary btn-block" @click="stationsStore.testWhatsApp()">{{ t('settings.testWhatsapp') }}</button>

    <hr class="settings-sep">

    <!-- Weather Underground -->
    <div class="settings-section-hd">
      {{ t('settings.wuTitle') }}
      <InfoIcon style="margin-left:auto">
        <strong>{{ t('settings.wuSetupTitle') }}</strong><br>
        <i18n-t keypath="settings.wuStep1" tag="span"><template #link><a href="https://www.wunderground.com" target="_blank" rel="noopener">wunderground.com</a></template></i18n-t><br>
        {{ t('settings.wuStep2') }}<br>
        {{ t('settings.wuStep3') }}<br>
        <hr>
        <strong>{{ t('settings.wuSearchTitle') }}</strong><br>
        {{ t('settings.wuSearchText') }}<br>
        → <a href="https://www.wunderground.com/wundermap" target="_blank" rel="noopener">wunderground.com/wundermap</a><br>
        {{ t('settings.wuSearchClick') }}<br>
        <hr>
        <strong>{{ t('settings.wuAddTitle') }}</strong><br>
        {{ t('settings.wuAddText') }}
      </InfoIcon>
    </div>
    <div class="field">
      <label>{{ t('settings.wuKeyLabel') }}</label>
      <input
        type="text"
        v-model="configStore.wuKey"
        placeholder="z.B. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
        @change="save"
      />
    </div>

    <hr class="settings-sep">

    <!-- Holfuy -->
    <div class="settings-section-hd">
      {{ t('settings.holfuyTitle') }}
      <InfoIcon style="margin-left:auto">
        <strong>{{ t('settings.holfuySetupTitle') }}</strong><br>
        {{ t('settings.holfuySetupText') }}<br>
        {{ t('settings.holfuyStep1') }}<br>
        {{ t('settings.holfuyStep2') }}<br>
        {{ t('settings.holfuyStep3') }}
      </InfoIcon>
    </div>
    <div class="field">
      <label>{{ t('settings.proxyLabel') }}</label>
      <input
        type="text"
        v-model="configStore.holfuyProxy"
        placeholder="https://holfuy-proxy.<du>.workers.dev"
        @change="save"
      />
    </div>

    <hr class="settings-sep">

    <!-- Folder sync -->
    <div class="settings-section-hd">
      {{ t('settings.syncTitle') }}
      <InfoIcon style="margin-left:auto">
        <strong>{{ t('settings.syncInfoTitle') }}</strong><br>
        {{ t('settings.syncInfoText1') }}<br>
        {{ t('settings.syncInfoText2') }}<br>
        <hr>
        {{ t('settings.syncInfoText3') }}
      </InfoIcon>
    </div>

    <template v-if="!configStore.fsSupported">
      <p class="settings-note">{{ t('settings.noFsSupport') }}</p>
    </template>
    <template v-else>
      <div v-if="configStore.folderStatus === 'disconnected'" class="field">
        <button class="btn-secondary btn-block" @click="onPickFolder">{{ t('settings.pickFolder') }}</button>
      </div>
      <div v-else class="folder-sync-row">
        <div class="folder-sync-info">
          <span class="folder-dot" :class="configStore.folderStatus"></span>
          <span>{{ configStore.folderName }}</span>
          <span class="folder-status-label">
            {{ configStore.folderStatus === 'connected' ? t('settings.connected') : t('settings.needsPermission') }}
          </span>
        </div>
        <div class="folder-sync-actions">
          <button
            v-if="configStore.folderStatus === 'needs-permission'"
            class="btn-secondary"
            @click="onReconnect"
          >{{ t('settings.connect') }}</button>
          <button class="btn-secondary" @click="onDisconnect">{{ t('settings.disconnect') }}</button>
        </div>
      </div>
    </template>

    <hr class="settings-sep">

    <!-- Language -->
    <div class="settings-section-hd">
      {{ t('settings.languageTitle') }}
    </div>
    <div class="field">
      <label>{{ t('settings.languageLabel') }}</label>
      <select v-model="configStore.language" @change="save">
        <option value="auto">{{ t('settings.languageAuto') }}</option>
        <option value="de">Deutsch</option>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="it">Italiano</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '../stores/config'
import { useStationsStore } from '../stores/stations'
import InfoIcon from './InfoIcon.vue'

const { t }         = useI18n()
const configStore   = useConfigStore()
const stationsStore = useStationsStore()

function save() {
  configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)
}

async function onPickFolder() {
  try {
    await configStore.pickFolder()
    configStore.loadConfig()
    stationsStore.loadStations()
    stationsStore.restartPolling()
  } catch (_e) {
    // user cancelled the picker
  }
}

async function onReconnect() {
  await configStore.reconnectFolder()
  configStore.loadConfig()
  stationsStore.loadStations()
  stationsStore.restartPolling()
}

async function onDisconnect() {
  await configStore.disconnectFolder()
}
</script>
