import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  DEFAULT_PRESET,
  SWING_ANIMATION,
  swingFrame,
  ballGone,
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

describe('swingFrame — full swing', () => {
  const full = SWING_ANIMATION.full

  it('steps through the seven backswing poses in order, reaching top on the top tone', () => {
    const seen = []
    for (let i = 0; i < 7; i++) seen.push(swingFrame(full, (i + 0.5) / 14, null))
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(swingFrame(full, 0.5, null)).toBe(7)
  })

  it('comes back down the same path, then into downswing and approach', () => {
    const seen = []
    for (let i = 0; i < 8; i++) seen.push(swingFrame(full, 0.5 + (i + 0.5) / 16, null))
    expect(seen).toEqual([7, 6, 5, 4, 3, 2, 8, 9])
  })

  it('shows impact on the impact tone, then release, follow-through, finish and back to setup', () => {
    expect(swingFrame(full, 0, 0)).toBe(10)
    expect(swingFrame(full, 0, 0.1)).toBe(11)
    expect(swingFrame(full, 0, 0.2)).toBe(12)
    expect(swingFrame(full, 0, 0.6)).toBe(13)
    expect(swingFrame(full, 0, 1.5)).toBe(0)
  })

  it('holds setup before the first rep', () => {
    expect(swingFrame(full, 0, null)).toBe(0)
  })
})

describe('swingFrame — chipping', () => {
  const chip = SWING_ANIMATION.chipping

  it('goes back to the top pose on the top tone and down to impact on the impact tone', () => {
    expect(swingFrame(chip, 0.01, null)).toBe(0)
    expect(swingFrame(chip, 0.49, null)).toBe(3)
    expect(swingFrame(chip, 0.5, null)).toBe(4)
    expect(swingFrame(chip, 0.99, null)).toBe(6)
    expect(swingFrame(chip, 0, 0)).toBe(7)
  })

  it('follows through to the finish, then resets', () => {
    expect(swingFrame(chip, 0, 0.1)).toBe(8)
    expect(swingFrame(chip, 0, 0.2)).toBe(9)
    expect(swingFrame(chip, 0, 0.6)).toBe(10)
    expect(swingFrame(chip, 0, 1.2)).toBe(0)
  })
})

describe('swingFrame — putting', () => {
  const putt = SWING_ANIMATION.putting

  it('reaches transition on the top tone and impact on the impact tone', () => {
    expect(swingFrame(putt, 0.49, null)).toBe(3)
    expect(swingFrame(putt, 0.5, null)).toBe(4)
    expect(swingFrame(putt, 0.99, null)).toBe(5)
    expect(swingFrame(putt, 0, 0)).toBe(6)
  })

  it('follows through and is back at setup inside the fastest metronome beat', () => {
    expect(swingFrame(putt, 0, 0.1)).toBe(7)
    expect(swingFrame(putt, 0, 0.2)).toBe(8)
    expect(swingFrame(putt, 0, 0.5)).toBe(9)
    expect(swingFrame(putt, 0, 0.62)).toBe(0)
  })
})

describe('ballGone', () => {
  it('ball is there through impact, gone during the follow-through, back on reset', () => {
    for (const anim of Object.values(SWING_ANIMATION)) {
      expect(ballGone(anim, null)).toBe(false)
      expect(ballGone(anim, 0)).toBe(false)
      expect(ballGone(anim, 0.3)).toBe(true)
      expect(ballGone(anim, 2)).toBe(false)
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
