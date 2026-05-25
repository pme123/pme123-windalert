import { computed } from 'vue'
import { useConfigStore } from '../stores/config'

export const BFT_LIMITS = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
// Midpoint of each Beaufort band (for reverse conversion)
export const BFT_MID = [0, 3, 9, 16, 24, 33, 44, 56, 68, 82, 96, 110, 125]

export function useUnits() {
  const configStore = useConfigStore()
  const unit = computed(() => configStore.unit)

  function kmhToUnit(kmh: number | null): number | null {
    if (kmh == null) return null
    if (unit.value === 'kmh') return kmh
    if (unit.value === 'kn') return kmh / 1.852
    // Beaufort
    for (let i = 0; i < BFT_LIMITS.length; i++) if (kmh < BFT_LIMITS[i]) return i
    return 12
  }

  function unitToKmh(val: string | number | null): number | null {
    if (val == null || val === '') return null
    if (unit.value === 'kmh') return +val
    if (unit.value === 'kn') return +val * 1.852
    return BFT_MID[Math.min(12, Math.max(0, Math.round(+val)))]
  }

  function unitLabel(): string {
    return unit.value === 'kmh' ? 'km/h' : unit.value === 'kn' ? 'kn' : 'Bft'
  }

  function fmtWind(kmh: number | null): string {
    const v = kmhToUnit(kmh)
    if (v == null) return '–'
    return unit.value === 'bft' ? String(Math.round(v)) : v.toFixed(1)
  }

  function fmtThresh(kmh: number): string {
    const v = kmhToUnit(kmh)
    if (v == null) return ''
    return String(Math.round(v))
  }

  return { unit, kmhToUnit, unitToKmh, unitLabel, fmtWind, fmtThresh }
}
