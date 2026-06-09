// Pure scoring-method calculation functions — no React, no Sheets, fully testable.

export const CHARLIE_YATES = {
  name: 'Charlie Yates Golf Course',
  key: 'charlie-yates',
  pars: [3, 3, 4, 3, 3, 4, 3, 3, 4] as const,
}

export interface HoleEntry {
  shotsToSZ: number        // shots taken to reach scoring zone (0 = never reached)
  approachesInSZ: number   // chip/pitch shots from within scoring zone
  totalPutts: number
  puttsInside4ft: number
  penalty: boolean
}

export interface RoundSummary {
  holes: number
  box1: number   // gave myself a chance (entered SZ in regulation)
  box2: number   // scored in position (got down in ≤3 from SZ)
  box3: number   // strokes gained putting (one-putt from outside 4ft)
  box4: number   // one-putts
  a: number      // out of position (holes − box1)
  b: number      // not down from SZ (holes − box2)
  c: number      // missed short putts
  d: number      // three-putts
  penalties: number
  totalPutts: number
}

export interface AggregateSummary {
  rounds: number
  avgESZPct: number       // box1 / holes, averaged across rounds
  avgSZDownPct: number    // box2 / holes
  avgPuttsPerHole: number
  avgMissedShortPutts: number
  avgThreePutts: number
  avgPenalties: number
}

// ESZ: entered scoring zone in regulation (shotsToSZ ≤ par − 2)
export function enteredInRegulation(h: HoleEntry, par: number): boolean {
  return h.shotsToSZ > 0 && h.shotsToSZ <= par - 2
}

// gotDown: approaches + putts ≤ 3 (DSZ). Guards against unplayed holes (all zeros).
export function gotDown(h: HoleEntry): boolean {
  return (h.approachesInSZ > 0 || h.totalPutts > 0) && h.approachesInSZ + h.totalPutts <= 3
}

export function calcSummary(holes: HoleEntry[], pars: readonly number[]): RoundSummary {
  const n = holes.length
  const box1 = holes.filter((h, i) => enteredInRegulation(h, pars[i])).length
  const box2 = holes.filter(h => gotDown(h)).length
  const box3 = holes.filter(h => h.totalPutts === 1 && h.puttsInside4ft === 0).length
  const box4 = holes.filter(h => h.totalPutts === 1).length
  const a = n - box1
  const b = n - box2
  const c = holes.reduce((sum, h) => sum + Math.max(0, h.puttsInside4ft - 1), 0)
  const d = holes.filter(h => h.totalPutts >= 3).length
  const penalties = holes.filter(h => h.penalty).length
  const totalPutts = holes.reduce((sum, h) => sum + h.totalPutts, 0)
  return { holes: n, box1, box2, box3, box4, a, b, c, d, penalties, totalPutts }
}

export function getFocusAreas(s: RoundSummary): string[] {
  const areas: string[] = []
  if (s.b >= 3) {
    areas.push(`Short game — only ${s.box2} of ${s.holes} scoring zone conversions`)
  } else if (s.b >= 2) {
    areas.push(`Short game — ${s.box2} of ${s.holes} scoring zone conversions`)
  }
  if (s.c >= 2) areas.push('Short putts — make them all inside 4ft')
  if (s.d >= 2) areas.push(`Pace of putting — ${s.d} three-putt${s.d > 1 ? 's' : ''} this round`)
  if (s.penalties >= 1) areas.push('Penalty strokes — play away, avoid trouble at all cost')
  return areas
}

export function calcAggregate(summaries: RoundSummary[]): AggregateSummary {
  const n = summaries.length
  if (n === 0) return { rounds: 0, avgESZPct: 0, avgSZDownPct: 0, avgPuttsPerHole: 0, avgMissedShortPutts: 0, avgThreePutts: 0, avgPenalties: 0 }
  const avg = (fn: (s: RoundSummary) => number) => summaries.reduce((sum, s) => sum + fn(s), 0) / n
  return {
    rounds: n,
    avgESZPct: avg(s => s.box1 / s.holes) * 100,
    avgSZDownPct: avg(s => s.box2 / s.holes) * 100,
    avgPuttsPerHole: avg(s => s.totalPutts / s.holes),
    avgMissedShortPutts: avg(s => s.c),
    avgThreePutts: avg(s => s.d),
    avgPenalties: avg(s => s.penalties),
  }
}
