import { describe, expect, it } from 'vitest'
import { bestIndex, markFor, marksFor } from '@/lib/scorecard'

describe('markFor', () => {
  it('first score has no mark', () => {
    expect(markFor(null, 5, 'higher_better')).toBe('first')
  })
  it('higher is better', () => {
    expect(markFor(5, 7, 'higher_better')).toBe('better')
    expect(markFor(5, 3, 'higher_better')).toBe('worse')
    expect(markFor(5, 5, 'higher_better')).toBe('same')
  })
  it('lower is better', () => {
    expect(markFor(15, 12, 'lower_better')).toBe('better')
    expect(markFor(12, 14, 'lower_better')).toBe('worse')
  })
  it('handles negative scores', () => {
    expect(markFor(-12, 0, 'higher_better')).toBe('better')
    expect(markFor(0, -3, 'higher_better')).toBe('worse')
  })
})

describe('marksFor', () => {
  it('marks a run against the previous score', () => {
    expect(marksFor([15, 12, 12, 14, 9], 'lower_better')).toEqual(['first', 'better', 'same', 'worse', 'better'])
  })
  it('empty run', () => {
    expect(marksFor([], 'higher_better')).toEqual([])
  })
})

describe('bestIndex', () => {
  it('finds the best by direction, first occurrence wins', () => {
    expect(bestIndex([3, 7, 7, 2], 'higher_better')).toBe(1)
    expect(bestIndex([15, 12, 9, 9], 'lower_better')).toBe(2)
    expect(bestIndex([], 'lower_better')).toBe(-1)
  })
})
