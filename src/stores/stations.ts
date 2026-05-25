import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Station, WindData, LogEntry, OWMStation } from '../types'
import { useConfigStore } from './config'
import { fetchWindData, fetchAllStations, fetchArchive } from '../services/pioupiou'
import { fetchMSWStation, fetchMSWMeta, fetchMSWArchive, getMswMeta, getMswMetaArr } from '../services/meteoswiss'
import { fetchWUStation } from '../services/wunderground'
import { useUnits } from '../composables/useUnits'

const DIRS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW']

function dirLabel(deg: number): string {
  return DIRS[Math.round(deg / 22.5) % 16]
}

function ts(): string {
  return new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

function makeStation(id = '', name = '', source: Station['source'] = 'pioupiou'): Station {
  return {
    id, name, source,
    tAvg: 20, tAvgOn: false,
    tMax: 40, tMaxOn: true,
    lastData: null, lastAlertAt: 0,
    chartRows: null, chartHours: 24,
    status: 'off',
  }
}

let logIdCounter = 0

export const useStationsStore = defineStore('stations', () => {
  const configStore = useConfigStore()

  const stations  = ref<Station[]>([])
  const activeIdx = ref(0)
  const log       = ref<LogEntry[]>([{ id: ++logIdCounter, type: 'info', msg: 'Bereit.', time: '--:--' }])

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let cdTimer:   ReturnType<typeof setInterval> | null = null
  const nextAt   = ref<number | null>(null)
  const countdown = ref('')

  // WhatsApp send
  async function sendWhatsApp(text: string) {
    const ph = configStore.phone.trim()
    const k  = configStore.key.trim()
    if (!ph || !k) {
      addLog('warn', `WhatsApp nicht konfiguriert – ${!ph ? 'Nummer' : 'API Key'} fehlt`)
      return
    }
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(ph)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(k)}`
    try {
      addLog('info', `WhatsApp: Anfrage wird gesendet an +${ph}…`)
      await fetch(url, { mode: 'no-cors' })
      addLog('ok', `WhatsApp: Anfrage abgeschickt an +${ph} (Zustellung via CallMeBot, keine Bestätigung möglich)`)
    } catch (e) {
      addLog('alert', `WhatsApp Fehler: ${(e as Error).message}`)
    }
  }

  // Log helpers
  function addLog(type: LogEntry['type'], msg: string) {
    log.value.unshift({ id: ++logIdCounter, type, msg, time: ts() })
    if (log.value.length > 80) log.value.splice(80)
  }

  function clearLog() {
    log.value = []
    addLog('info', 'Protokoll geleert')
  }

  // Persistence helpers
  function stationsForSave() {
    return stations.value.map(({ id, name, source, tAvg, tAvgOn, tMax, tMaxOn, lastAlertAt }) => ({
      id, name, source: source || 'pioupiou', tAvg, tAvgOn, tMax, tMaxOn, lastAlertAt,
    }))
  }

  function saveConfig() {
    configStore.saveConfig(stationsForSave(), activeIdx.value)
  }

  function loadStations() {
    try {
      const c   = JSON.parse(localStorage.getItem('waCfg2') || '{}')
      const old = JSON.parse(localStorage.getItem('waCfg')  || '{}')

      stations.value = (c.stations && c.stations.length)
        ? c.stations.map((s: Partial<Station>) => ({ ...makeStation(), ...s, lastData: null, chartRows: null }))
        : [makeStation(old.sid ?? '2172', old.sname ?? 'Schiberenegg')]

      activeIdx.value = Math.min(+(c.activeIdx ?? 0), stations.value.length - 1)

      // restore per-station thresholds from old config on first migration
      if (!c.stations?.length && old.tAvg != null) {
        stations.value[0].tAvg   = old.tAvg
        stations.value[0].tAvgOn = old.tAvgOn ?? false
        stations.value[0].tMax   = old.tMax   ?? 40
        stations.value[0].tMaxOn = old.tMaxOn ?? true
      }

      // if we pulled values from old config, persist immediately
      const ph  = c.phone || old.phone || ''
      const k   = c.key   || old.key   || ''
      if ((!c.phone && ph) || (!c.key && k)) {
        setTimeout(saveConfig, 0)
      }
    } catch (_e) {
      stations.value = [makeStation('2172', 'Schiberenegg')]
    }
  }

  // Units composable (used inside store methods)
  function getUnits() {
    return useUnits()
  }

  // Threshold check
  function checkThresholds(idx: number, data: WindData) {
    const s = stations.value[idx]
    if (!s) return
    const { fmtWind, fmtThresh, unitLabel } = getUnits()
    const m       = data.measurements
    const sname   = s.name || (data.meta?.name) || `Station ${data.id || s.id}`
    const reasons: string[] = []

    const avgKmh = m.wind_speed_avg
    const maxKmh = m.wind_speed_max
    const parts:  string[] = []

    if (s.tAvgOn) {
      const hit = avgKmh != null && avgKmh >= s.tAvg
      parts.push(`Ø ${avgKmh != null ? fmtWind(avgKmh) : '–'}${hit ? ' ✓' : ` (Schwelle: ${fmtThresh(s.tAvg)})`} ${unitLabel()}`)
      if (hit) reasons.push(`Ø ${fmtWind(avgKmh)} ${unitLabel()} ≥ ${fmtThresh(s.tAvg)} ${unitLabel()}`)
    }
    if (s.tMaxOn) {
      const hit = maxKmh != null && maxKmh >= s.tMax
      parts.push(`Böen ${maxKmh != null ? fmtWind(maxKmh) : '–'}${hit ? ' ✓' : ` (Schwelle: ${fmtThresh(s.tMax)})`} ${unitLabel()}`)
      if (hit) reasons.push(`Böen ${fmtWind(maxKmh)} ${unitLabel()} ≥ ${fmtThresh(s.tMax)} ${unitLabel()}`)
    }
    addLog('info', `[${sname}] ${parts.length ? parts.join(' | ') : 'keine Schwellen aktiv'}`)

    s.status = reasons.length ? 'warn' : 'ok'

    if (!reasons.length) return

    const now  = Date.now()
    const cdMs = configStore.cd * 60000
    if (now - s.lastAlertAt < cdMs) {
      const rem = Math.round((cdMs - (now - s.lastAlertAt)) / 60000)
      addLog('warn', `[${sname}] ⏱ Schwelle überschritten – Pause aktiv (noch ${rem} min)`)
      return
    }
    s.lastAlertAt = now
    saveConfig()

    const dir = m.wind_heading
    const msg = `⚠️ Wind Alert: ${sname}\n${reasons.join(', ')}\nRichtung: ${dir != null ? dirLabel(dir) + ' (' + Math.round(dir) + '°)' : '–'}\n${new Date().toLocaleString('de-CH')}`

    addLog('alert', `[${sname}] ALERT: ${reasons.join(' | ')}`)
    sendWhatsApp(msg)

    if (configStore.nNotif)  showBrowserNotif(sname, reasons.join(', '))
    if (configStore.nBanner) showBanner(`${sname}: ${reasons.join(' | ')}`)
    if (configStore.nSound)  playAlertSound()
    if (configStore.nDialog) setTimeout(() => alert(`⚠️ Wind Alert: ${sname}\n\n${reasons.join('\n')}`), 100)
  }

  // Notification helpers
  function showBrowserNotif(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    new Notification(`🌬️ Wind Alert: ${title}`, { body })
  }

  const bannerText    = ref('')
  const bannerVisible = ref(false)

  function showBanner(text: string) {
    bannerText.value    = text
    bannerVisible.value = true
  }
  function dismissBanner() {
    bannerVisible.value = false
  }

  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      ;[0, 0.25, 0.5].forEach(off => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0, ctx.currentTime + off)
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + off + 0.02)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + off + 0.18)
        osc.start(ctx.currentTime + off)
        osc.stop(ctx.currentTime + off + 0.2)
      })
    } catch (e) {
      addLog('info', `Ton nicht möglich: ${(e as Error).message}`)
    }
  }

  // Fetch a single station
  async function fetchStation(idx: number) {
    const s = stations.value[idx]
    if (!s?.id) return
    try {
      let data: WindData
      if (s.source === 'meteoswiss') {
        data = await fetchMSWStation(s.id)
      } else if (s.source === 'wunderground') {
        data = await fetchWUStation(s.id, configStore.wuKey)
      } else {
        data = await fetchWindData(s.id)
        // Auto-name from Pioupiou API on first load
        if (!s.name && data.meta?.name) {
          s.name = data.meta.name
          saveConfig()
        }
      }
      s.lastData = data
      checkThresholds(idx, data)
    } catch (e) {
      s.status = 'err'
      if (idx === activeIdx.value) {
        addLog('alert', `Ladefehler: ${(e as Error).message}`)
      }
    }
  }

  async function pollAll() {
    await Promise.all(stations.value.map((_, i) => fetchStation(i)))
  }

  function restartPolling() {
    if (pollTimer) clearInterval(pollTimer)
    if (cdTimer)   clearInterval(cdTimer)
    const iv = configStore.iv
    pollAll()
    nextAt.value = Date.now() + iv
    pollTimer = setInterval(() => {
      pollAll()
      nextAt.value = Date.now() + iv
    }, iv)
    cdTimer = setInterval(() => {
      if (!nextAt.value) return
      const s = Math.max(0, Math.round((nextAt.value - Date.now()) / 1000))
      countdown.value = `↺ in ${s}s`
    }, 1000)
  }

  // Tab management
  function addStation() {
    const s = makeStation()
    stations.value.push(s)
    activeIdx.value = stations.value.length - 1
    saveConfig()
  }

  function removeStation(idx: number) {
    if (stations.value.length <= 1) return
    stations.value.splice(idx, 1)
    if (activeIdx.value >= stations.value.length) activeIdx.value = stations.value.length - 1
    saveConfig()
  }

  function switchTab(idx: number) {
    activeIdx.value = idx
    saveConfig()
  }

  // Load chart data
  async function loadChartData(hours: number): Promise<void> {
    const s = stations.value[activeIdx.value]
    if (!s) return
    if (s.source === 'wunderground') return
    s.chartHours = hours
    const sid = s.id
    if (!sid) return
    try {
      const rows = s.source === 'meteoswiss'
        ? await fetchMSWArchive(sid, hours)
        : await fetchArchive(sid, hours)
      s.chartRows = rows
    } catch (e) {
      addLog('warn', `Verlaufsdaten Fehler: ${(e as Error).message}`)
    }
  }

  // OWM (Pioupiou) stations cache
  const owmStations  = ref<OWMStation[]>([])
  const owmLoaded    = ref(false)

  async function loadOWMStations() {
    if (owmLoaded.value) return
    try {
      const list = await fetchAllStations()
      owmStations.value = list
      owmLoaded.value   = true
      addLog('info', `OpenWindMap: ${list.length} aktive Stationen geladen`)
    } catch (e) {
      addLog('warn', `Fehler beim Laden der Stationen: ${(e as Error).message}`)
    }
    try {
      await fetchMSWMeta()
      addLog('info', `MeteoSwiss: ${getMswMetaArr().length} Stationen geladen`)
    } catch (e) {
      addLog('warn', `MeteoSwiss Metadaten Fehler: ${(e as Error).message}`)
    }
  }

  // Select station from search
  function selectOWM(id: number, name: string) {
    const s  = stations.value[activeIdx.value]
    if (!s) return
    s.id     = String(id)
    s.name   = name
    s.source = 'pioupiou'
    s.status = 'off'
    saveConfig()
    fetchStation(activeIdx.value)
    loadChartData(s.chartHours ?? 24)
  }

  function selectMSWStation(abbr: string, name: string) {
    const s   = stations.value[activeIdx.value]
    if (!s) return
    s.id      = abbr
    s.name    = name
    s.source  = 'meteoswiss'
    saveConfig()
    fetchStation(activeIdx.value)
  }

  async function selectWUFromSearch(stationId: string) {
    addLog('info', `WU: Lade Station ${stationId}…`)
    try {
      const data = await fetchWUStation(stationId, configStore.wuKey)
      const nm   = data.meta.name as string
      const s    = stations.value[activeIdx.value]
      if (!s) return
      s.id       = stationId
      s.name     = nm
      s.source   = 'wunderground'
      s.lastData = data
      saveConfig()
      addLog('ok', `WU: ${nm} (${stationId}) geladen`)
    } catch (e) {
      addLog('alert', `WU Fehler: ${(e as Error).message}`)
    }
  }

  async function testAllAlerts() {
    const s = stations.value[activeIdx.value]
    const sname = s?.name || (s?.id ? `Station ${s.id}` : 'Test')
    addLog('info', 'Test aller Benachrichtigungen…')
    if (configStore.nSound)  playAlertSound()
    if (configStore.nBanner) showBanner(`Test: ${sname} – Böen 42.0 km/h`)
    if (configStore.nNotif)  showBrowserNotif(sname, 'Test: Böen 42 km/h')
    if (configStore.nDialog) setTimeout(() => alert(`⚠️ Wind Alert TEST\nStation: ${sname}\nBöen 42 km/h`), 100)
  }

  async function testWhatsApp() {
    const s = stations.value[activeIdx.value]
    const sname = s?.name || (s?.id ? `Station ${s.id}` : 'Test')
    addLog('info', 'Sende Test-Nachricht…')
    await sendWhatsApp(`🧪 Wind Alert Test\nStation: ${sname}\nDie Alerts sind aktiv.\n${new Date().toLocaleString('de-CH')}`)
  }

  async function maybeRequestNotif() {
    if (configStore.nNotif) {
      const p = await Notification.requestPermission()
      addLog(p === 'granted' ? 'ok' : 'info',
        p === 'granted' ? 'Browser-Benachrichtigungen aktiviert' : 'Berechtigung verweigert')
    }
  }

  const activeStation = computed(() => stations.value[activeIdx.value] ?? null)

  return {
    stations,
    activeIdx,
    activeStation,
    log,
    countdown,
    bannerText,
    bannerVisible,
    owmStations,
    owmLoaded,
    getMswMeta,
    loadStations,
    saveConfig,
    stationsForSave,
    makeStation,
    fetchStation,
    pollAll,
    restartPolling,
    checkThresholds,
    addLog,
    clearLog,
    addStation,
    removeStation,
    switchTab,
    loadChartData,
    loadOWMStations,
    selectOWM,
    selectMSWStation,
    selectWUFromSearch,
    sendWhatsApp,
    playAlertSound,
    showBanner,
    dismissBanner,
    testAllAlerts,
    testWhatsApp,
    maybeRequestNotif,
  }
})
