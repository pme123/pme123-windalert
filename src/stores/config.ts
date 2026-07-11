import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { WindUnit } from '../types'
import {
  isFsSyncSupported,
  getStoredHandle,
  clearStoredHandle,
  verifyPermission,
  pickDirectory,
  readConfigFile,
  writeConfigFile,
} from '../services/fsSync'
import { setLocale, LANGUAGE_AUTO, type LanguageSetting } from '../i18n'

export type FolderStatus = 'disconnected' | 'connected' | 'needs-permission'

export const useConfigStore = defineStore('config', () => {
  // Global settings
  const unit    = ref<WindUnit>('kn')
  const phone   = ref('')
  const key     = ref('')
  const wuKey   = ref('')
  const holfuyProxy = ref('')
  const nDialog = ref(false)
  const nSound  = ref(true)
  const nBanner = ref(true)
  const nNotif  = ref(true)
  const cd      = ref(30)    // cooldown in minutes
  const iv      = ref(300000) // polling interval in ms
  const language = ref<LanguageSetting>(LANGUAGE_AUTO)

  watch(language, (l) => setLocale(l), { immediate: true })

  // Folder sync
  const fsSupported  = isFsSyncSupported()
  const folderName    = ref<string | null>(null)
  const folderStatus  = ref<FolderStatus>('disconnected')
  let   dirHandle: FileSystemDirectoryHandle | null = null

  function loadConfig() {
    try {
      const c   = JSON.parse(localStorage.getItem('waCfg2') || '{}')
      const old = JSON.parse(localStorage.getItem('waCfg')  || '{}') // migrate from v1

      // || instead of ?? so empty-string values from waCfg2 also fall back to old config
      phone.value   = c.phone   || old.phone   || ''
      key.value     = c.key     || old.key     || ''
      wuKey.value   = c.wuKey   || ''
      holfuyProxy.value = c.holfuyProxy || ''
      nDialog.value = c.nDialog ?? old.nDialog ?? false
      nSound.value  = c.nSound  ?? old.nSound  ?? true
      nBanner.value = c.nBanner ?? old.nBanner ?? true
      nNotif.value  = c.nNotif  ?? old.nNotif  ?? true
      cd.value      = c.cd      ?? old.cd      ?? 30
      iv.value      = c.iv      ?? old.iv      ?? 300000
      unit.value    = c.unit    ?? 'kn'
      language.value = c.language ?? LANGUAGE_AUTO
    } catch (_e) {
      // defaults already set
    }
  }

  function buildConfigJson(stationsData: object[], activeIdx: number): string {
    return JSON.stringify({
      stations: stationsData,
      activeIdx,
      phone:   phone.value,
      key:     key.value,
      wuKey:   wuKey.value,
      holfuyProxy: holfuyProxy.value,
      nDialog: nDialog.value,
      nSound:  nSound.value,
      nBanner: nBanner.value,
      nNotif:  nNotif.value,
      cd:      cd.value,
      iv:      iv.value,
      unit:    unit.value,
      language: language.value,
    })
  }

  function saveConfig(stationsData: object[], activeIdx: number) {
    const json = buildConfigJson(stationsData, activeIdx)
    localStorage.setItem('waCfg2', json)
    if (dirHandle && folderStatus.value === 'connected') {
      writeConfigFile(dirHandle, json).catch(() => {
        folderStatus.value = 'needs-permission'
      })
    }
  }

  // Try to silently reconnect to a previously chosen folder (no user gesture).
  // If a config file is found there, it takes precedence over localStorage.
  async function initFolderSync(): Promise<void> {
    if (!fsSupported) return
    const handle = await getStoredHandle()
    if (!handle) return
    dirHandle   = handle
    folderName.value = handle.name

    const granted = await verifyPermission(handle, false)
    if (!granted) {
      folderStatus.value = 'needs-permission'
      return
    }
    folderStatus.value = 'connected'
    const text = await readConfigFile(handle)
    if (text) localStorage.setItem('waCfg2', text)
  }

  // User-initiated folder pick (requires a click / gesture)
  async function pickFolder(): Promise<void> {
    const handle = await pickDirectory()
    dirHandle          = handle
    folderName.value   = handle.name
    folderStatus.value = 'connected'

    const text = await readConfigFile(handle)
    if (text) {
      localStorage.setItem('waCfg2', text)
    } else {
      // No config there yet — seed it with whatever is currently in localStorage
      const current = localStorage.getItem('waCfg2')
      if (current) await writeConfigFile(handle, current)
    }
  }

  // Re-grant permission after a reload (requires a click / gesture)
  async function reconnectFolder(): Promise<void> {
    if (!dirHandle) return
    const granted = await verifyPermission(dirHandle, true)
    if (!granted) return
    folderStatus.value = 'connected'
    const text = await readConfigFile(dirHandle)
    if (text) localStorage.setItem('waCfg2', text)
  }

  async function disconnectFolder(): Promise<void> {
    await clearStoredHandle()
    dirHandle           = null
    folderName.value    = null
    folderStatus.value  = 'disconnected'
  }

  return {
    unit, phone, key, wuKey, holfuyProxy, nDialog, nSound, nBanner, nNotif, cd, iv, language,
    loadConfig, saveConfig,
    fsSupported, folderName, folderStatus,
    initFolderSync, pickFolder, reconnectFolder, disconnectFolder,
  }
})
