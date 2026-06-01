import { getRows, toObj, parseBool, nullNum } from '@/lib/sheets'
import type { Drill } from '@/lib/types'

export function rowToDrill(r: Record<string, string>): Drill {
  return {
    id:                r.id,
    name:              r.name,
    description:       r.description,
    instructions:      r.instructions,
    scoring_direction: r.scoring_direction as Drill['scoring_direction'],
    max_score:         nullNum(r.max_score),
    min_score:         Number(r.min_score),
    unit:              r.unit,
    is_default:        parseBool(r.is_default),
    created_at:        r.created_at,
  }
}

export async function getDrills(): Promise<Drill[]> {
  const rows = await getRows('drills')
  return rows
    .map(toObj)
    .map(rowToDrill)
    .sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export async function getDrill(id: string): Promise<Drill | null> {
  const rows = await getRows('drills')
  const row = rows.map(toObj).find(r => r.id === id)
  return row ? rowToDrill(row) : null
}
