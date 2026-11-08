import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  DEFAULT_PRESET,
  spriteFrame,
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
import { SWING_SPRITES } from '../../components/tempo/swing-sprites'

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

describe('spriteFrame', () => {
  const chip = { segments: { back: 48, down: 24, through: 30 }, throughSeconds: 0.5, resetAt: 1.1 }

  it('starts from setup and reaches the top frame on the top tone', () => {
    expect(spriteFrame(chip, 0, null)).toBe(0)
    expect(spriteFrame(chip, 0.01, null)).toBe(1)
    expect(spriteFrame(chip, 0.4999, null)).toBe(47)
    expect(spriteFrame(chip, 0.5, null)).toBe(48)
  })

  it('reaches the impact frame by the impact tone and plays the follow-through from there', () => {
    expect(spriteFrame(chip, 0.9999, null)).toBe(71)
    expect(spriteFrame(chip, 0, 0)).toBe(72)
    expect(spriteFrame(chip, 0, 0.25)).toBe(87)
    expect(spriteFrame(chip, 0, 0.5)).toBe(101)
  })

  it('holds the finish, then resets to setup', () => {
    expect(spriteFrame(chip, 0, 1)).toBe(101)
    expect(spriteFrame(chip, 0, 1.2)).toBe(0)
  })

  it('frames only ever move forward through a stroke', () => {
    let prev = 0
    for (let s = 0.001; s < 1; s += 0.001) {
      const f = spriteFrame(chip, s, null)
      expect(f).toBeGreaterThanOrEqual(prev)
      prev = f
    }
    for (let t = 0; t < 1.1; t += 0.01) {
      const f = spriteFrame(chip, 0, t)
      expect(f).toBeGreaterThanOrEqual(prev)
      prev = f
    }
  })

  it('uses each shot type’s own follow-through timing', () => {
    const putt = { segments: { back: 36, down: 18, through: 24 }, throughSeconds: 0.35, resetAt: 0.6 }
    expect(spriteFrame(putt, 0, 0.35)).toBe(77)
    expect(spriteFrame(putt, 0, 0.59)).toBe(77)
    expect(spriteFrame(putt, 0, 0.6)).toBe(0)
  })

  it('putting is back at setup inside the fastest metronome beat', () => {
    expect(SWING_SPRITES.putting.resetAt).toBeLessThan(60 / BPM_MAX)
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
