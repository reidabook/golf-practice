import { getCachedRows } from '@/lib/sheets'
import { type HoleEntry, calcSummary, CHARLIE_YATES } from '@/lib/round-scoring'

export interface Round {
  id: string
  course: string
  date: string
  createdAt: string
  holes: HoleEntry[]
}

function rowToHole(r: Record<string, string>): HoleEntry {
  return {
    shotsToSZ: Number(r.shots_to_sz),
    approachesInSZ: Number(r.approaches_in_sz),
    totalPutts: Number(r.total_putts),
    puttsInside4ft: Number(r.putts_inside_4ft),
    penalty: r.penalty === 'true',
  }
}

export async function getRounds(): Promise<Round[]> {
  const [roundRows, holeRows] = await Promise.all([
    getCachedRows('rounds').catch(() => [] as Record<string, string>[]),
    getCachedRows('round_holes').catch(() => [] as Record<string, string>[]),
  ])

  const holesByRound = new Map<string, HoleEntry[]>()
  for (const r of holeRows) {
    const id = r.round_id
    if (!holesByRound.has(id)) holesByRound.set(id, [])
    holesByRound.get(id)!.push(rowToHole(r))
  }

  return roundRows
    .map(r => ({
      id: r.id,
      course: r.course,
      date: r.date,
      createdAt: r.created_at,
      holes: (holesByRound.get(r.id) ?? []).sort((a, b) => 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getParsForCourse(course: string): readonly number[] {
  if (course === CHARLIE_YATES.key) return CHARLIE_YATES.pars
  return CHARLIE_YATES.pars // default until multi-course support
}
