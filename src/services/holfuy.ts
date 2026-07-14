import type { WindData, ChartRow } from '../types'
import { i18n } from '../i18n'

const t = i18n.global.t

interface HolfuyResponse {
  stationId?: number
  stationName?: string
  dateTime?: string
  wind?: { speed?: number; gust?: number; min?: number; direction?: number }
  location?: { latitude?: number; longitude?: number }
  error?: string
  errorCode?: string | null
}

interface HolfuyArchiveRow {
  dateTime?: string
  wind?: { speed?: number; gust?: number; min?: number; direction?: number }
}

interface HolfuyArchiveResponse {
  measurements?: HolfuyArchiveRow[]
  data?: HolfuyArchiveRow[]
  error?: string
}

// Password is optional client-side — the proxy worker may inject a shared
// password server-side for stations it knows about (see cloudflare-worker/holfuy-proxy.js).
function checkProxy(proxyBase: string) {
  if (!proxyBase) throw new Error(t('logMsg.holfuyNoProxy'))
}

function pwParam(pw: string): string {
  return pw ? `&pw=${encodeURIComponent(pw)}` : ''
}

// Holfuy returns timestamps as "YYYY-MM-DD HH:mm:ss" with no timezone marker.
// We always request &utc, so this is UTC — mark it explicitly (ISO + "Z") so
// `new Date(...)` doesn't misinterpret it as the browser's local time.
function toIsoUtc(dateTime: string): string {
  return dateTime.replace(' ', 'T') + 'Z'
}

export async function fetchHolfuyStation(id: string, pw: string, proxyBase: string): Promise<WindData> {
  checkProxy(proxyBase)

  const url = `${proxyBase.replace(/\/$/, '')}/?s=${encodeURIComponent(id)}${pwParam(pw)}&m=JSON&tu=C&su=km/h&loc&utc`
  const r   = await fetch(url)
  if (!r.ok) throw new Error(t('logMsg.holfuyProxyHttpError', { status: r.status }))

  const json: HolfuyResponse = await r.json()
  if (json.error) throw new Error(t('logMsg.holfuyApiError', { msg: json.error }))

  return {
    id: json.stationId ?? id,
    meta: { name: json.stationName || `Holfuy ${id}` },
    location: {
      latitude:  json.location?.latitude,
      longitude: json.location?.longitude,
      success:   !!(json.location?.latitude && json.location?.longitude),
    },
    measurements: {
      date:           json.dateTime ? toIsoUtc(json.dateTime) : null,
      wind_heading:   json.wind?.direction ?? null,
      wind_speed_avg: json.wind?.speed ?? null,
      wind_speed_max: json.wind?.gust  ?? null,
      wind_speed_min: json.wind?.min   ?? null,
    },
  }
}

export async function fetchHolfuyArchive(id: string, pw: string, proxyBase: string, hours: number): Promise<ChartRow[]> {
  checkProxy(proxyBase)

  const base = `${proxyBase.replace(/\/$/, '')}/archive?s=${encodeURIComponent(id)}${pwParam(pw)}&m=JSON&su=km/h&tu=C&utc`

  // Short ranges: use raw data (cnt), highest resolution available.
  // Longer ranges: start_date/stop_date forces hourly averages server-side (Holfuy API behavior),
  // needed since 'cnt' is capped at 500 rows and can't cover multiple days at raw resolution.
  const url = hours <= 48
    ? `${base}&cnt=500`
    : (() => {
        const stop  = new Date()
        const start = new Date(+stop - hours * 3600 * 1000)
        const fmt   = (d: Date) => d.toISOString().slice(0, 10)
        return `${base}&start_date=${fmt(start)}&stop_date=${fmt(stop)}`
      })()

  const r = await fetch(url)
  if (!r.ok) throw new Error(t('logMsg.holfuyProxyHttpError', { status: r.status }))

  const json: HolfuyArchiveResponse | HolfuyArchiveRow[] = await r.json()
  if (!Array.isArray(json) && json.error) throw new Error(t('logMsg.holfuyApiError', { msg: json.error }))

  const rows: HolfuyArchiveRow[] = Array.isArray(json) ? json : (json.measurements ?? json.data ?? [])

  return rows
    .filter(row => row.dateTime)
    .map((row): ChartRow => [
      toIsoUtc(row.dateTime as string),
      null,
      null,
      row.wind?.min   ?? null,
      row.wind?.speed ?? null,
      row.wind?.gust  ?? null,
    ])
    // Holfuy returns rows newest-first; the chart expects oldest-first (ascending time)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
}
