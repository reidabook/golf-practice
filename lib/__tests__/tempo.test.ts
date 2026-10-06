import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  DEFAULT_PRESET,
  MODES,
  BPM_MIN,
  BPM_MAX,
  BPM_DEFAULT,
  framesToMs,
  getPreset,
  presetSeconds,
  clampBpm,
  beatSeconds,
  metronomeSeconds,
} from '../tempo'

describe('framesToMs', () => {
  it('converts 30fps frames to milliseconds', () => {
    expect(framesToMs(30)).toBe(1000)
    expect(framesToMs(24)).toBe(800)
    expect(framesToMs(8)).toBe(267)
    expect(framesToMs(9)).toBe(300)
  })
})

describe('PRESETS', () => {
  it('full swing presets are exactly 3:1', () => {
    for (const p of PRESETS.full) expect(p.back / p.down).toBe(3)
  })

  it('putting and chipping presets are exactly 2:1', () => {
    for (const p of [...PRESETS.putting, ...PRESETS.chipping]) expect(p.back / p.down).toBe(2)
  })

  it('offers the expected tempos per mode', () => {
    expect(PRESETS.full.map(p => p.id)).toEqual(['18/6', '21/7', '24/8', '27/9', '30/10'])
    const short = ['14/7', '16/8', '18/9', '20/10', '22/11', '24/12']
    expect(PRESETS.putting.map(p => p.id)).toEqual(short)
    expect(PRESETS.chipping.map(p => p.id)).toEqual(short)
  })

  it('every mode has a default that exists in its presets', () => {
    for (const { id } of MODES) {
      expect(PRESETS[id].some(p => p.id === DEFAULT_PRESET[id])).toBe(true)
    }
  })
})

describe('getPreset', () => {
  it('returns the matching preset', () => {
    expect(getPreset('full', '21/7')).toEqual({ id: '21/7', back: 21, down: 7 })
  })

  it('falls back to the mode default for an unknown id', () => {
    expect(getPreset('full', '18/9').id).toBe('24/8')
    expect(getPreset('putting', 'nope').id).toBe('18/9')
  })
})

describe('presetSeconds', () => {
  it('returns backswing and downswing in seconds', () => {
    const { back, down } = presetSeconds(getPreset('full', '24/8'))
    expect(back).toBeCloseTo(0.8)
    expect(down).toBeCloseTo(0.2667, 3)
  })
})

describe('clampBpm', () => {
  it('clamps to the supported range and rounds', () => {
    expect(clampBpm(40)).toBe(BPM_MIN)
    expect(clampBpm(200)).toBe(BPM_MAX)
    expect(clampBpm(75.6)).toBe(76)
  })

  it('falls back to the default for non-numbers', () => {
    expect(clampBpm(NaN)).toBe(BPM_DEFAULT)
  })
})

describe('metronome', () => {
  it('beat length matches bpm', () => {
    expect(beatSeconds(60)).toBe(1)
    expect(beatSeconds(75)).toBeCloseTo(0.8)
  })

  it('splits one beat 2:1 and rests one beat', () => {
    const { back, down, gap } = metronomeSeconds(60)
    expect(back + down).toBeCloseTo(1)
    expect(back / down).toBeCloseTo(2)
    expect(gap).toBe(1)
  })
})
