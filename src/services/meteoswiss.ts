import type { MSWStationMeta, WindData } from '../types'

export const MSW_CURRENT = 'https://data.geo.admin.ch/ch.meteoschweiz.messwerte-aktuell/VQHA80.csv'
export const MSW_META    = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/ogd-smn_meta_stations.csv'

// Cache: 9 minutes
let mswCache: { ts: number; rows: Map<string, { dir: number | null; avg: number | null; max: number | null; date: string }> } | null = null
let mswMetaMap: Map<string, MSWStationMeta> | null = null
let mswMetaArr_: MSWStationMeta[] = []

export function getMswMetaArr(): MSWStationMeta[] {
  return mswMetaArr_
}

export function getMswMeta(): Map<string, MSWStationMeta> | null {
  return mswMetaMap
}

export async function fetchMSWMeta(): Promise<void> {
  if (mswMetaMap) return
  const r    = await fetch(MSW_META)
  const text = await r.text()
  const lines = text.trim().split('\n')
  mswMetaMap  = new Map()
  mswMetaArr_ = []
  for (let i = 1; i < lines.length; i++) {
    const c    = lines[i].split(';')
    const abbr = c[0]?.trim()
    if (!abbr) continue
    const obj: MSWStationMeta = {
      abbr,
      name:      c[1]?.trim() || abbr,
      canton:    c[2]?.trim() || '',
      elevation: parseFloat(c[10]) || null,
      lat:       parseFloat(c[14]),
      lon:       parseFloat(c[15]),
    }
    mswMetaMap.set(abbr, obj)
    mswMetaArr_.push(obj)
  }
}

export async function fetchMSWCurrent(): Promise<Map<string, { dir: number | null; avg: number | null; max: number | null; date: string }>> {
  const now = Date.now()
  if (mswCache && now - mswCache.ts < 9 * 60 * 1000) return mswCache.rows
  const r    = await fetch(MSW_CURRENT)
  const text = await r.text()
  const lines = text.trim().split('\n')
  // cols: 0=abbr 1=date(YYYYMMDDHHmm) 2=temp ... 8=dir 9=avg_kmh 10=max_kmh
  const rows = new Map<string, { dir: number | null; avg: number | null; max: number | null; date: string }>()
  for (let i = 1; i < lines.length; i++) {
    const c    = lines[i].split(';')
    const abbr = c[0]?.trim()
    if (!abbr) continue
    const ds   = c[1]?.trim() || ''
    const date = ds.length === 12
      ? `${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}T${ds.slice(8,10)}:${ds.slice(10,12)}:00.000Z`
      : new Date().toISOString()
    const dir = parseFloat(c[8])
    const avg = parseFloat(c[9])
    const max = parseFloat(c[10])
    rows.set(abbr, {
      date,
      dir: isNaN(dir) ? null : dir,
      avg: isNaN(avg) ? null : avg,
      max: isNaN(max) ? null : max,
    })
  }
  mswCache = { ts: now, rows }
  return rows
}

export async function fetchMSWStation(abbr: string): Promise<WindData> {
  const rows = await fetchMSWCurrent()
  const row  = rows.get(abbr)
  if (!row) throw new Error(`MeteoSwiss Station ${abbr} nicht in Daten gefunden`)
  const meta = mswMetaMap?.get(abbr)
  return {
    id:   abbr,
    meta: { name: meta?.name || abbr },
    location: (meta?.lat && !isNaN(meta.lat))
      ? { latitude: meta.lat, longitude: meta.lon, success: true }
      : { success: false },
    measurements: {
      date:            row.date,
      wind_heading:    row.dir,
      wind_speed_avg:  row.avg,
      wind_speed_max:  row.max,
      wind_speed_min:  null,
    },
  }
}
