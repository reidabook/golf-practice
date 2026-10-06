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
]

export const PRESETS: Record<TempoMode, TempoPreset[]> = {
  putting: SHORT_PRESETS,
  chipping: SHORT_PRESETS,
  full: [
    { id: '18/6', back: 18, down: 6 },
    { id: '21/7', back: 21, down: 7 },
    { id: '24/8', back: 24, down: 8 },
    { id: '27/9', back: 27, down: 9 },
  ],
}

export const DEFAULT_PRESET: Record<TempoMode, string> = {
  putting: '18/9',
  chipping: '18/9',
  full: '24/8',
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
