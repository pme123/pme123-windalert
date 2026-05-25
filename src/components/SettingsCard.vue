<template>
  <div class="bottom-card">
    <div class="card-title" style="margin-bottom:16px">Einstellungen</div>

    <!-- WhatsApp -->
    <div class="settings-section-hd">
      WhatsApp Alert
      <InfoIcon style="margin-left:auto">
        <strong>Einrichtung (einmalig)</strong><br>
        1. Nummer <strong>+34 644 97 79 48</strong> als „CallMeBot" speichern<br>
        2. Nachricht senden: <em>I allow callmebot to send me messages</em><br>
        3. API Key empfangen &amp; oben eintragen<br>
        <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener">→ callmebot.com Anleitung</a>
        <hr>
        <strong>Rate Limit</strong><br>
        CallMeBot erlaubt max. <strong>16 Nachrichten pro 240 Min.</strong> Bei Überschreitung werden Nachrichten in eine Warteschlange gestellt (HTTP 210) und verzögert zugestellt.<br>
        → Empfehlung: Cooldown ≥ 60 Min. setzen<br>
        → Bei Problemen: erneut <em>I allow callmebot to send me messages</em> senden
      </InfoIcon>
    </div>
    <div class="field">
      <label>Telefonnummer (mit Ländervorwahl, ohne +)</label>
      <input
        type="text"
        v-model="configStore.phone"
        placeholder="41791234567"
        @change="save"
      />
    </div>
    <div class="field">
      <label>CallMeBot API Key</label>
      <input
        type="text"
        v-model="configStore.key"
        placeholder="Wird per WhatsApp zugestellt"
        @change="save"
      />
    </div>
    <button class="btn-secondary btn-block" @click="stationsStore.testWhatsApp()">WhatsApp testen</button>

    <hr class="settings-sep">

    <!-- Weather Underground -->
    <div class="settings-section-hd">
      Weather Underground
      <InfoIcon style="margin-left:auto">
        <strong>Einrichtung</strong><br>
        1. Konto erstellen auf <a href="https://www.wunderground.com" target="_blank" rel="noopener">wunderground.com</a><br>
        2. API Key unter <em>My Profile → Settings → API Keys</em> generieren<br>
        3. Key oben eintragen<br>
        <hr>
        <strong>Station suchen</strong><br>
        Station-ID auf der Karte finden:<br>
        → <a href="https://www.wunderground.com/wundermap" target="_blank" rel="noopener">wunderground.com/wundermap</a><br>
        Station anklicken → ID z.B. <em>IHYRES96</em> erscheint im Panel<br>
        <hr>
        <strong>Station hinzufügen</strong><br>
        ID in der Station-Suche eingeben (4–15 Zeichen) → <span style="color:#fb923c;font-weight:700">PWS</span>-Eintrag anklicken
      </InfoIcon>
    </div>
    <div class="field">
      <label>API Key</label>
      <input
        type="text"
        v-model="configStore.wuKey"
        placeholder="z.B. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
        @change="save"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../stores/config'
import { useStationsStore } from '../stores/stations'
import InfoIcon from './InfoIcon.vue'

const configStore   = useConfigStore()
const stationsStore = useStationsStore()

function save() {
  configStore.saveConfig(stationsStore.stationsForSave(), stationsStore.activeIdx)
}
</script>
