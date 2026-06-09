import { describe, it, expect } from 'vitest'
import {
  calcSummary,
  enteredInRegulation,
  gotDown,
  calcAggregate,
  CHARLIE_YATES,
  type HoleEntry,
} from '../round-scoring'

// Actual round played at Charlie Yates Golf Course (from Numbers spreadsheet).
// Yellow-cell inputs: shotsToSZ, approachesInSZ, totalPutts, puttsInside4ft, penalty.
const charlieYatesRound: HoleEntry[] = [
  { shotsToSZ: 1, approachesInSZ: 1, totalPutts: 2, puttsInside4ft: 1, penalty: false }, // H1 Par 3
  { shotsToSZ: 1, approachesInSZ: 2, totalPutts: 2, puttsInside4ft: 1, penalty: false }, // H2 Par 3
  { shotsToSZ: 1, approachesInSZ: 2, totalPutts: 2, puttsInside4ft: 1, penalty: false }, // H3 Par 4
  { shotsToSZ: 3, approachesInSZ: 2, totalPutts: 1, puttsInside4ft: 0, penalty: true  }, // H4 Par 3 (penalty)
  { shotsToSZ: 1, approachesInSZ: 3, totalPutts: 1, puttsInside4ft: 0, penalty: false }, // H5 Par 3
  { shotsToSZ: 1, approachesInSZ: 1, totalPutts: 2, puttsInside4ft: 1, penalty: false }, // H6 Par 4
  { shotsToSZ: 1, approachesInSZ: 1, totalPutts: 3, puttsInside4ft: 2, penalty: false }, // H7 Par 3 (3-putt)
  { shotsToSZ: 1, approachesInSZ: 2, totalPutts: 2, puttsInside4ft: 1, penalty: false }, // H8 Par 3
  { shotsToSZ: 1, approachesInSZ: 3, totalPutts: 3, puttsInside4ft: 1, penalty: false }, // H9 Par 4 (3-putt)
]

const PARS = CHARLIE_YATES.pars

describe('enteredInRegulation', () => {
  it('returns true when shots ≤ par − 2', () => {
    expect(enteredInRegulation({ shotsToSZ: 1, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }, 3)).toBe(true)
    expect(enteredInRegulation({ shotsToSZ: 2, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }, 4)).toBe(true)
  })
  it('returns false when shots > par − 2', () => {
    expect(enteredInRegulation({ shotsToSZ: 2, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }, 3)).toBe(false)
    expect(enteredInRegulation({ shotsToSZ: 3, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }, 3)).toBe(false)
  })
  it('returns false when shotsToSZ is 0 (not entered)', () => {
    expect(enteredInRegulation({ shotsToSZ: 0, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }, 3)).toBe(false)
  })
})

describe('gotDown', () => {
  it('returns true when approaches + putts ≤ 3', () => {
    expect(gotDown({ shotsToSZ: 1, approachesInSZ: 1, totalPutts: 2, puttsInside4ft: 1, penalty: false })).toBe(true)
    expect(gotDown({ shotsToSZ: 1, approachesInSZ: 2, totalPutts: 1, puttsInside4ft: 0, penalty: false })).toBe(true)
  })
  it('returns false when approaches + putts > 3', () => {
    expect(gotDown({ shotsToSZ: 1, approachesInSZ: 2, totalPutts: 2, puttsInside4ft: 1, penalty: false })).toBe(false)
  })
  it('does NOT require ESZ — hole 4 got down despite penalty', () => {
    const hole4 = charlieYatesRound[3]
    expect(enteredInRegulation(hole4, PARS[3])).toBe(false) // missed regulation
    expect(gotDown(hole4)).toBe(true)                        // still got down
  })
  it('returns false when nothing recorded (unplayed hole)', () => {
    expect(gotDown({ shotsToSZ: 0, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false })).toBe(false)
  })
  it('returns true for a chip-in (approaches=1, putts=0)', () => {
    expect(gotDown({ shotsToSZ: 1, approachesInSZ: 1, totalPutts: 0, puttsInside4ft: 0, penalty: false })).toBe(true)
  })
})

describe('calcSummary — Charlie Yates round', () => {
  const s = calcSummary(charlieYatesRound, PARS)

  it('box1: 8 holes entered SZ in regulation', () => expect(s.box1).toBe(8))
  it('box2: 3 holes got down from SZ', () => expect(s.box2).toBe(3))
  it('box3: 2 one-putts from outside 4ft (holes 4 & 5)', () => expect(s.box3).toBe(2))
  it('box4: 2 one-putts total', () => expect(s.box4).toBe(2))
  it('a: 1 hole out of position', () => expect(s.a).toBe(1))
  it('b: 6 holes not down from SZ (9 − box2)', () => expect(s.b).toBe(6))
  it('c: 1 missed short putt (hole 7 had 2 putts ≤4ft)', () => expect(s.c).toBe(1))
  it('d: 2 three-putt holes (holes 7 & 9)', () => expect(s.d).toBe(2))
  it('1 penalty (hole 4)', () => expect(s.penalties).toBe(1))
  it('18 total putts', () => expect(s.totalPutts).toBe(18))
})

describe('calcAggregate', () => {
  const s = calcSummary(charlieYatesRound, PARS)

  it('returns zeros for empty input', () => {
    const agg = calcAggregate([])
    expect(agg.rounds).toBe(0)
    expect(agg.avgESZPct).toBe(0)
  })

  it('averages correctly across one round', () => {
    const agg = calcAggregate([s])
    expect(agg.rounds).toBe(1)
    expect(agg.avgESZPct).toBeCloseTo((8 / 9) * 100, 1)
    expect(agg.avgSZDownPct).toBeCloseTo((3 / 9) * 100, 1)
    expect(agg.avgPuttsPerHole).toBeCloseTo(18 / 9, 2)
    expect(agg.avgMissedShortPutts).toBe(1)
    expect(agg.avgThreePutts).toBe(2)
    expect(agg.avgPenalties).toBe(1)
  })

  it('averages correctly across two rounds', () => {
    const agg = calcAggregate([s, s])
    expect(agg.rounds).toBe(2)
    expect(agg.avgESZPct).toBeCloseTo((8 / 9) * 100, 1)
  })
})
