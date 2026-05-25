export type WindSource = 'pioupiou' | 'meteoswiss' | 'wunderground'
export type StationStatus = 'off' | 'ok' | 'warn' | 'err'
export type WindUnit = 'kn' | 'kmh' | 'bft'

export interface Station {
  id: string
  name: string
  source: WindSource
  tAvg: number       // stored in km/h internally
  tAvgOn: boolean
  tMax: number       // stored in km/h internally
  tMaxOn: boolean
  lastAlertAt: number
  chartHours: number
  status: StationStatus
  lastData: WindData | null
  chartRows: ChartRow[] | null
}

export interface WindData {
  id: string | number
  meta: { name?: string }
  location: { latitude?: number; longitude?: number; success: boolean }
  measurements: {
    date: string | null
    wind_heading: number | null
    wind_speed_avg: number | null  // km/h
    wind_speed_max: number | null  // km/h
    wind_speed_min: number | null  // km/h
  }
}

export interface LogEntry {
  id: number
  type: 'info' | 'ok' | 'warn' | 'alert'
  msg: string
  time: string
}

export interface MSWStationMeta {
  abbr: string
  name: string
  canton: string
  elevation: number | null
  lat: number
  lon: number
}

export interface OWMStation {
  id: number
  meta: { name: string }
  location?: { latitude: number; longitude: number }
  measurements?: { date: string; wind_speed_avg: number; wind_speed_max: number }
  status?: { state: string }
}

// Archive rows: [timestamp, ?, ?, min_kmh, avg_kmh, max_kmh, ...]
export type ChartRow = [string, unknown, unknown, number | null, number | null, number | null, ...unknown[]]
