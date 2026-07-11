import type { WindData } from '../types'
import { i18n } from '../i18n'

const t = i18n.global.t

export const WU_BASE = 'https://api.weather.com/v2/pws/observations/current'

export async function fetchWUStation(stationId: string, apiKey: string): Promise<WindData> {
  if (!apiKey) throw new Error(t('logMsg.wuNoApiKey'))
  if (!/^[A-Z0-9]{3,15}$/i.test(stationId))
    throw new Error(t('logMsg.wuInvalidStationId', { id: stationId }))

  const url = `${WU_BASE}?stationId=${encodeURIComponent(stationId)}&format=json&units=m&apiKey=${encodeURIComponent(apiKey)}`
  const r   = await fetch(url)

  if (r.status === 204 || r.status === 404)
    throw new Error(t('logMsg.wuStationNotFound', { id: stationId }))

  const text = await r.text()
  if (!text) throw new Error(t('logMsg.wuStationNotFoundEmpty', { id: stationId }))

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
    throw new Error(t('logMsg.wuParseError', { status: r.status, text: text.slice(0, 120) }))
  }

  if (!r.ok || json.errors) {
    const msg = json.errors?.[0]?.error?.message || json.message || `HTTP ${r.status}`
    throw new Error(t('logMsg.wuApiError', { msg }))
  }

  if (!json.observations?.length) throw new Error(t('logMsg.wuNoMeasurements', { id: stationId }))

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
