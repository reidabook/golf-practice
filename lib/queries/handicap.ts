import { getRows, toObj } from '@/lib/sheets'
import type { HandicapSnapshot } from '@/lib/types'

export async function getHandicapHistory(): Promise<HandicapSnapshot[]> {
  try {
    const rows = await getRows('handicap_snapshots')
    return rows
      .map(toObj)
      .map(r => ({
        snapshot_date:   r.snapshot_date,
        handicap_index:  Number(r.handicap_index),
      }))
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
  } catch {
    return []
  }
}
