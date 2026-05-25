import type { MSWStationMeta, WindData, ChartRow } from '../types'

export const MSW_CURRENT = 'https://data.geo.admin.ch/ch.meteoschweiz.messwerte-aktuell/VQHA80.csv'
export const MSW_META    = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/ogd-smn_meta_stations.csv'
const MSW_ARCHIVE_BASE   = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn'

// Cache: 9 minutes
let mswCache: { ts: number; rows: Map<string, { dir: number | null; avg: number | null; max: number | null; date: string }> } | null = null

// Archive cache: _recent files only update daily → cache 1 hour
const mswRecentCache = new Map<string, { ts: number; text: string }>()
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

// ── Archive (10-min chart data) ──────────────────────────────────────────────

function mswArchiveUrl(abbr: string, type: 'now' | 'recent'): string {
  const a = abbr.toLowerCase()
  return `${MSW_ARCHIVE_BASE}/${a}/ogd-smn_${a}_t_${type}.csv`
}

/** Parse "DD.MM.YYYY HH:MM" → Unix ms (local Swiss time treated as UTC+1/+2 by browser) */
function parseMSWTimestamp(s: string): number {
  const [datePart, timePart] = s.trim().split(' ')
  if (!datePart || !timePart) return NaN
  const [d, m, y] = datePart.split('.')
  // MeteoSwiss timestamps are in UTC
  return Date.UTC(+y, +m - 1, +d, +timePart.split(':')[0], +timePart.split(':')[1])
}

function parseMSWCsvToRows(text: string, since: number): ChartRow[] {
  const lines  = text.trim().split('\n')
  if (lines.length < 2) return []
  const header = lines[0].split(';')
  const tsIdx  = header.indexOf('reference_timestamp')
  const avgIdx = header.indexOf('fu3010z0')
  const maxIdx = header.indexOf('fu3010z1')
  if (tsIdx < 0 || avgIdx < 0) return []

  const rows: ChartRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c  = lines[i].split(';')
    const ts = parseMSWTimestamp(c[tsIdx] ?? '')
    if (isNaN(ts) || ts < since) continue
    const avg = parseFloat(c[avgIdx])
    const max = maxIdx >= 0 ? parseFloat(c[maxIdx]) : NaN
    rows.push([
      new Date(ts).toISOString(),
      null, null,
      isNaN(avg) ? null : avg,   // min (use avg — no min available)
      isNaN(avg) ? null : avg,   // avg
      isNaN(max) ? null : max,   // gust
    ])
  }
  return rows
}

async function fetchMSWRecentText(abbr: string): Promise<string> {
  const key    = abbr.toLowerCase()
  const cached = mswRecentCache.get(key)
  if (cached && Date.now() - cached.ts < 3_600_000) return cached.text
  const r = await fetch(mswArchiveUrl(abbr, 'recent'))
  if (!r.ok) throw new Error(`MeteoSwiss archive HTTP ${r.status}`)
  const text = await r.text()
  mswRecentCache.set(key, { ts: Date.now(), text })
  return text
}

export async function fetchMSWArchive(abbr: string, hours: number): Promise<ChartRow[]> {
  const since = Date.now() - hours * 3_600_000
  // Fetch today's data (_now) and recent data in parallel
  const [nowText, recentText] = await Promise.all([
    fetch(mswArchiveUrl(abbr, 'now')).then(r => r.ok ? r.text() : ''),
    fetchMSWRecentText(abbr),
  ])
  const combined = [
    ...parseMSWCsvToRows(recentText, since),
    ...parseMSWCsvToRows(nowText, since),
  ]
  // Sort by timestamp and deduplicate
  combined.sort((a, b) => new Date(a[0] as string).getTime() - new Date(b[0] as string).getTime())
  const seen = new Set<string>()
  return combined.filter(r => {
    const k = r[0] as string
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
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
