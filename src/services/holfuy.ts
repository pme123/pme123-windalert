import type { WindData } from '../types'

interface HolfuyResponse {
  stationId?: number
  stationName?: string
  dateTime?: string
  wind?: { speed?: number; gust?: number; min?: number; direction?: number }
  location?: { latitude?: number; longitude?: number }
  error?: string
  errorCode?: string | null
}

export async function fetchHolfuyStation(id: string, pw: string, proxyBase: string): Promise<WindData> {
  if (!proxyBase) throw new Error('Kein Holfuy Proxy-URL konfiguriert (Einstellungen)')
  if (!pw) throw new Error('Kein Holfuy Passwort für diese Station eingetragen')

  const url = `${proxyBase.replace(/\/$/, '')}/?s=${encodeURIComponent(id)}&pw=${encodeURIComponent(pw)}&m=JSON&tu=C&su=km/h`
  const r   = await fetch(url)
  if (!r.ok) throw new Error(`Holfuy Proxy HTTP ${r.status}`)

  const json: HolfuyResponse = await r.json()
  if (json.error) throw new Error(`Holfuy: ${json.error}`)

  return {
    id: json.stationId ?? id,
    meta: { name: json.stationName || `Holfuy ${id}` },
    location: {
      latitude:  json.location?.latitude,
      longitude: json.location?.longitude,
      success:   !!(json.location?.latitude && json.location?.longitude),
    },
    measurements: {
      date:           json.dateTime ?? null,
      wind_heading:   json.wind?.direction ?? null,
      wind_speed_avg: json.wind?.speed ?? null,
      wind_speed_max: json.wind?.gust  ?? null,
      wind_speed_min: json.wind?.min   ?? null,
    },
  }
}
