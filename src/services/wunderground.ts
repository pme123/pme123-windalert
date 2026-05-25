import type { WindData } from '../types'

export const WU_BASE = 'https://api.weather.com/v2/pws/observations/current'

export async function fetchWUStation(stationId: string, apiKey: string): Promise<WindData> {
  if (!apiKey) throw new Error('Kein Weather Underground API Key konfiguriert')
  if (!/^[A-Z0-9]{3,15}$/i.test(stationId))
    throw new Error(`Ungültige Station ID "${stationId}" – nur Buchstaben und Ziffern, 3–15 Zeichen`)

  const url = `${WU_BASE}?stationId=${encodeURIComponent(stationId)}&format=json&units=m&apiKey=${encodeURIComponent(apiKey)}`
  const r   = await fetch(url)

  if (r.status === 204 || r.status === 404)
    throw new Error(`Station "${stationId}" nicht gefunden – bitte Station ID prüfen`)

  const text = await r.text()
  if (!text) throw new Error(`Station "${stationId}" nicht gefunden (leere Antwort)`)

  let json: {
    observations?: Array<{
      stationID: string
      neighborhood?: string
      lat: number
      lon: number
      obsTimeUtc: string
      winddir?: number
      metric?: { windSpeed?: number; windGust?: number }
    }>
    errors?: Array<{ error?: { message?: string } }>
    message?: string
  }
  try {
    json = JSON.parse(text)
  } catch (_e) {
    throw new Error(`WU ${r.status}: ${text.slice(0, 120)}`)
  }

  if (!r.ok || json.errors) {
    const msg = json.errors?.[0]?.error?.message || json.message || `HTTP ${r.status}`
    throw new Error(`WU: ${msg}`)
  }

  if (!json.observations?.length) throw new Error(`Station "${stationId}" hat keine aktuellen Messwerte`)

  const obs = json.observations[0]
  return {
    id:   obs.stationID,
    meta: { name: obs.neighborhood || obs.stationID },
    location: {
      latitude:  obs.lat,
      longitude: obs.lon,
      success:   !!(obs.lat && obs.lon),
    },
    measurements: {
      date:           obs.obsTimeUtc,
      wind_heading:   obs.winddir ?? null,
      wind_speed_avg: obs.metric?.windSpeed ?? null,   // km/h
      wind_speed_max: obs.metric?.windGust  ?? null,   // km/h
      wind_speed_min: null,
    },
  }
}
