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

/** Shot types with golfer poses to animate; the others hold the setup pose. */
export const ANIMATES_GOLFER: Record<TempoMode, boolean> = {
  putting: false,
  chipping: false,
  full: true,
}

// Indexes into GOLFER_FRAMES (components/tempo/golfer-frames.ts):
// 0 setup, 1 takeaway, 2 hip-high, 3 halfway, 4 chest-high, 5 three-quarter, 6 head-high, 7 top,
// 8 downswing, 9 approach, 10 impact, 11 release, 12 follow-through, 13 finish
const BACK_FRAMES = [0, 1, 2, 3, 4, 5, 6]
const DOWN_FRAMES = [7, 6, 5, 4, 3, 2, 8, 9]
const IMPACT_FRAME = 10
/** First pose in which the ball has been hit. */
export const BALL_GONE_FRAME = 11
// Seconds after impact at which each later pose ends
const IMPACT_HOLD = 0.06
const RELEASE_END = 0.14
const FOLLOW_THROUGH_END = 0.3
const FINISH_END = 1.1

/**
 * Golfer pose for the swing dial. `swing` is the ring progress (0 → 0.5 backswing, 0.5 → 1 downswing),
 * `sinceImpact` the seconds since the impact tone (null before it). Top lands exactly on the top tone
 * and impact on the impact tone; the follow-through plays into the rest, then the golfer resets to setup.
 */
export function swingFrame(swing: number, sinceImpact: number | null): number {
  if (swing > 0 && swing < 0.5) return BACK_FRAMES[Math.floor(swing * 2 * BACK_FRAMES.length)]
  if (swing >= 0.5 && swing < 1) return DOWN_FRAMES[Math.floor((swing - 0.5) * 2 * DOWN_FRAMES.length)]
  if (sinceImpact === null) return 0
  if (sinceImpact < IMPACT_HOLD) return IMPACT_FRAME
  if (sinceImpact < RELEASE_END) return 11
  if (sinceImpact < FOLLOW_THROUGH_END) return 12
  if (sinceImpact < FINISH_END) return 13
  return 0
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
