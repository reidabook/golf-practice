// Tempo presets are expressed as frames of 30fps video (Tour Tempo convention):
// "24/8" = 24 frames takeaway → top, 8 frames top → impact.

export type TempoMode = 'putting' | 'chipping' | 'full'
export type PuttStyle = 'tones' | 'metronome'

export interface TempoPreset {
  id: string
  back: number // frames
  down: number // frames
}

export interface ModeInfo {
  id: TempoMode
  label: string
  ratio: string
  help: string
}

export const FPS = 30
export const BPM_MIN = 60
export const BPM_MAX = 90
export const BPM_DEFAULT = 76
export const GAP_OPTIONS = [2, 3, 5] as const

export const MODES: ModeInfo[] = [
  {
    id: 'putting',
    label: 'Putting',
    ratio: '2:1',
    help: 'Stroke time stays the same for every putt — longer putts get a longer stroke, not a slower one. Start at 18/9.',
  },
  {
    id: 'chipping',
    label: 'Chipping',
    ratio: '2:1',
    help: 'Short game runs 2:1, quicker and more even than the full swing. Start at 18/9; go lower for a brisker tempo.',
  },
  {
    id: 'full',
    label: 'Full swing',
    ratio: '3:1',
    help: 'Tour swings are 3:1 backswing to downswing. Start at 24/8; try 21/7 if it feels slow. Faster is usually better than slower.',
  },
]

const SHORT_PRESETS: TempoPreset[] = [
  { id: '14/7', back: 14, down: 7 },
  { id: '16/8', back: 16, down: 8 },
  { id: '18/9', back: 18, down: 9 },
  { id: '20/10', back: 20, down: 10 },
  { id: '22/11', back: 22, down: 11 },
  { id: '24/12', back: 24, down: 12 },
]

export const PRESETS: Record<TempoMode, TempoPreset[]> = {
  putting: SHORT_PRESETS,
  chipping: SHORT_PRESETS,
  full: [
    { id: '18/6', back: 18, down: 6 },
    { id: '21/7', back: 21, down: 7 },
    { id: '24/8', back: 24, down: 8 },
    { id: '27/9', back: 27, down: 9 },
    { id: '30/10', back: 30, down: 10 },
  ],
}

export const DEFAULT_PRESET: Record<TempoMode, string> = {
  putting: '18/9',
  chipping: '18/9',
  full: '24/8',
}

/** How the swing dial's golfer flips through its poses for one shot type. Numbers index GOLFER_FRAMES[mode]. */
export interface SwingAnimation {
  /** poses spread evenly over the backswing, starting from setup */
  back: number[]
  /** poses spread evenly over the downswing; the first one lands on the top tone */
  down: number[]
  /** pose shown on the impact tone */
  impact: number
  /** poses after impact, each shown until `until` seconds after it; the golfer then resets to setup */
  after: { until: number; frame: number }[]
}

// Seconds the impact pose is held before the follow-through starts
const IMPACT_HOLD = 0.06

// Frame order comes from MODES in scripts/trace-golfer.py (see GOLFER_POSES in components/tempo/golfer-frames.ts)
export const SWING_ANIMATION: Record<TempoMode, SwingAnimation> = {
  // 0 setup, 1 pre-stroke, 2 takeaway, 3 mid takeaway, 4 transition, 5 forward stroke, 6 impact,
  // 7 early follow-through, 8 mid follow-through, 9 finish. Resets by 0.6 s to fit the fastest metronome beat.
  putting: {
    back: [0, 1, 2, 3],
    down: [4, 5],
    impact: 6,
    after: [
      { until: 0.15, frame: 7 },
      { until: 0.3, frame: 8 },
      { until: 0.6, frame: 9 },
    ],
  },
  // 0 setup, 1 early takeaway, 2 mid takeaway, 3 waist-high, 4 top, 5 downswing, 6 approach, 7 impact,
  // 8 early follow-through, 9 follow-through, 10 finish
  chipping: {
    back: [0, 1, 2, 3],
    down: [4, 3, 2, 5, 6],
    impact: 7,
    after: [
      { until: 0.14, frame: 8 },
      { until: 0.35, frame: 9 },
      { until: 1.1, frame: 10 },
    ],
  },
  // 0 setup, 1 takeaway, 2 hip-high, 3 halfway, 4 chest-high, 5 three-quarter, 6 head-high, 7 top,
  // 8 downswing, 9 approach, 10 impact, 11 release, 12 follow-through, 13 finish
  full: {
    back: [0, 1, 2, 3, 4, 5, 6],
    down: [7, 6, 5, 4, 3, 2, 8, 9],
    impact: 10,
    after: [
      { until: 0.14, frame: 11 },
      { until: 0.3, frame: 12 },
      { until: 1.1, frame: 13 },
    ],
  },
}

/**
 * Golfer pose for the swing dial. `swing` is the ring progress (0 → 0.5 backswing, 0.5 → 1 downswing),
 * `sinceImpact` the seconds since the impact tone (null before it). The top pose lands exactly on the
 * top tone and impact on the impact tone; the follow-through plays into the rest, then the golfer resets.
 */
export function swingFrame(anim: SwingAnimation, swing: number, sinceImpact: number | null): number {
  if (swing > 0 && swing < 0.5) return anim.back[Math.floor(swing * 2 * anim.back.length)]
  if (swing >= 0.5 && swing < 1) return anim.down[Math.floor((swing - 0.5) * 2 * anim.down.length)]
  if (sinceImpact === null) return 0
  if (sinceImpact < IMPACT_HOLD) return anim.impact
  return anim.after.find(a => sinceImpact < a.until)?.frame ?? 0
}

/** True once the ball has been hit, until the golfer resets to setup. */
export function ballGone(anim: SwingAnimation, sinceImpact: number | null): boolean {
  return sinceImpact !== null && sinceImpact >= IMPACT_HOLD && sinceImpact < anim.after[anim.after.length - 1].until
}

export function framesToMs(frames: number): number {
  return Math.round((frames * 1000) / FPS)
}

export function getPreset(mode: TempoMode, id: string): TempoPreset {
  return (
    PRESETS[mode].find(p => p.id === id) ??
    PRESETS[mode].find(p => p.id === DEFAULT_PRESET[mode])!
  )
}

/** Backswing and downswing durations in seconds. */
export function presetSeconds(preset: TempoPreset): { back: number; down: number } {
  return { back: preset.back / FPS, down: preset.down / FPS }
}

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return BPM_DEFAULT
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)))
}

export function beatSeconds(bpm: number): number {
  return 60 / clampBpm(bpm)
}

/**
 * Metronome stroke: takeaway on one tick, impact on the next.
 * The beat is split 2:1 so the visual shows where the top of the stroke falls.
 */
export function metronomeSeconds(bpm: number): { back: number; down: number; gap: number } {
  const beat = beatSeconds(bpm)
  return { back: (beat * 2) / 3, down: beat / 3, gap: beat }
}
