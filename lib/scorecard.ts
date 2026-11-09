import type { ScoringDirection, TrendDirection } from '@/lib/types'

/**
 * Scorecard marks, golf-scorecard style: a circle for a score better than the one before it
 * (a "birdie"), a square for worse (a "bogey"), nothing for the same score or the first one.
 * "Better" follows the drill's scoring direction.
 */
export function markFor(prev: number | null, cur: number, direction: ScoringDirection): TrendDirection {
  if (prev === null) return 'first'
  if (cur === prev) return 'same'
  const higherIsBetter = direction === 'higher_better'
  return (cur > prev) === higherIsBetter ? 'better' : 'worse'
}

/** Marks for a run of scores in the order they were logged. */
export function marksFor(scores: number[], direction: ScoringDirection): TrendDirection[] {
  return scores.map((s, i) => markFor(i === 0 ? null : scores[i - 1], s, direction))
}

/** Index of the best score (first occurrence), or -1 when there are no scores. */
export function bestIndex(scores: number[], direction: ScoringDirection): number {
  if (scores.length === 0) return -1
  let best = 0
  for (let i = 1; i < scores.length; i++) {
    const better = direction === 'higher_better' ? scores[i] > scores[best] : scores[i] < scores[best]
    if (better) best = i
  }
  return best
}
