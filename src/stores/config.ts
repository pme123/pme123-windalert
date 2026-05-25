import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WindUnit } from '../types'

export const useConfigStore = defineStore('config', () => {
  // Global settings
  const unit    = ref<WindUnit>('kn')
  const phone   = ref('')
  const key     = ref('')
  const wuKey   = ref('')
  const nDialog = ref(false)
  const nSound  = ref(true)
  const nBanner = ref(true)
  const nNotif  = ref(true)
  const cd      = ref(30)    // cooldown in minutes
  const iv      = ref(300000) // polling interval in ms

  function loadConfig() {
    try {
      const c   = JSON.parse(localStorage.getItem('waCfg2') || '{}')
      const old = JSON.parse(localStorage.getItem('waCfg')  || '{}') // migrate from v1

      // || instead of ?? so empty-string values from waCfg2 also fall back to old config
      phone.value   = c.phone   || old.phone   || ''
      key.value     = c.key     || old.key     || ''
      wuKey.value   = c.wuKey   || ''
      nDialog.value = c.nDialog ?? old.nDialog ?? false
      nSound.value  = c.nSound  ?? old.nSound  ?? true
      nBanner.value = c.nBanner ?? old.nBanner ?? true
      nNotif.value  = c.nNotif  ?? old.nNotif  ?? true
      cd.value      = c.cd      ?? old.cd      ?? 30
      iv.value      = c.iv      ?? old.iv      ?? 300000
      unit.value    = c.unit    ?? 'kn'
    } catch (_e) {
      // defaults already set
    }
  }

  function saveConfig(stationsData: object[], activeIdx: number) {
    localStorage.setItem('waCfg2', JSON.stringify({
      stations: stationsData,
      activeIdx,
      phone:   phone.value,
      key:     key.value,
      wuKey:   wuKey.value,
      nDialog: nDialog.value,
      nSound:  nSound.value,
      nBanner: nBanner.value,
      nNotif:  nNotif.value,
      cd:      cd.value,
      iv:      iv.value,
      unit:    unit.value,
    }))
  }

  return { unit, phone, key, wuKey, nDialog, nSound, nBanner, nNotif, cd, iv, loadConfig, saveConfig }
})
