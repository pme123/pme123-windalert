import type { WindData, OWMStation, ChartRow } from '../types'

export const PIOUPIOU_LIVE    = 'https://api.pioupiou.fr/v1/live/'
export const PIOUPIOU_ARCHIVE = 'https://api.pioupiou.fr/v1/archive/'
export const PIOUPIOU_ALL     = 'https://api.pioupiou.fr/v1/live/all'

export async function fetchWindData(sid: string): Promise<WindData> {
  const r = await fetch(PIOUPIOU_LIVE + sid)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const json = await r.json()
  return json.data as WindData
}

export async function fetchAllStations(): Promise<OWMStation[]> {
  const r = await fetch(PIOUPIOU_ALL)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const json = await r.json()
  return (json.data as OWMStation[])
    .filter(s => s.status?.state === 'on' && s.meta?.name)
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name, 'de'))
}

export async function fetchArchive(sid: string, hours: number): Promise<ChartRow[]> {
  const stop  = new Date()
  const start = new Date(+stop - hours * 3600 * 1000)
  const url   = `${PIOUPIOU_ARCHIVE}${sid}?start=${start.toISOString()}&stop=${stop.toISOString()}`
  const r     = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const json  = await r.json()
  return (json.data || []) as ChartRow[]
}
