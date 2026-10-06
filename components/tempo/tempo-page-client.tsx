'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Play, Plus, Square } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TempoEngine } from '@/lib/tempo-audio'
import {
  BPM_DEFAULT,
  BPM_MAX,
  BPM_MIN,
  DEFAULT_PRESET,
  GAP_OPTIONS,
  MODES,
  PRESETS,
  clampBpm,
  framesToMs,
  getPreset,
  metronomeSeconds,
  presetSeconds,
  type PuttStyle,
  type TempoMode,
} from '@/lib/tempo'

const STORAGE_KEY = 'tempo-settings'

interface Settings {
  mode: TempoMode
  presets: Record<TempoMode, string>
  puttStyle: PuttStyle
  bpm: number
  gap: number
  repeat: boolean
  volume: number
}

const DEFAULTS: Settings = {
  mode: 'full',
  presets: DEFAULT_PRESET,
  puttStyle: 'tones',
  bpm: BPM_DEFAULT,
  gap: 3,
  repeat: true,
  volume: 0.8,
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const s = JSON.parse(raw) as Partial<Settings>
    const mode = MODES.some(m => m.id === s.mode) ? s.mode! : DEFAULTS.mode
    const presets = { ...DEFAULTS.presets }
    for (const { id } of MODES) presets[id] = getPreset(id, s.presets?.[id] ?? '').id
    return {
      mode,
      presets,
      puttStyle: s.puttStyle === 'metronome' ? 'metronome' : 'tones',
      bpm: clampBpm(Number(s.bpm)),
      gap: GAP_OPTIONS.includes(s.gap as (typeof GAP_OPTIONS)[number]) ? s.gap! : DEFAULTS.gap,
      repeat: typeof s.repeat === 'boolean' ? s.repeat : DEFAULTS.repeat,
      volume: typeof s.volume === 'number' ? Math.min(1, Math.max(0, s.volume)) : DEFAULTS.volume,
    }
  } catch {
    return DEFAULTS
  }
}

type WakeLock = { release: () => Promise<void> }

export function TempoPageClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [playing, setPlaying] = useState(false)

  const engineRef = useRef<TempoEngine | null>(null)
  const wakeLockRef = useRef<WakeLock | null>(null)
  const startedKeyRef = useRef('')
  const dotRef = useRef<HTMLDivElement>(null)
  const restBarRef = useRef<HTMLDivElement>(null)
  const restLabelRef = useRef<HTMLSpanElement>(null)

  const { mode, presets, puttStyle, bpm, gap, repeat, volume } = settings
  const update = (patch: Partial<Settings>) => setSettings(s => ({ ...s, ...patch }))

  // Restore saved settings after mount (avoids a hydration mismatch)
  useEffect(() => {
    setSettings(loadSettings())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // storage unavailable — settings just won't persist
    }
  }, [settings, loaded])

  const modeInfo = MODES.find(m => m.id === mode)!
  const metronome = mode === 'putting' && puttStyle === 'metronome'
  const preset = getPreset(mode, presets[mode])

  const timing = useMemo(() => {
    if (metronome) return { ...metronomeSeconds(bpm), repeat: true, topTone: false }
    return { ...presetSeconds(preset), gap, repeat, topTone: true }
  }, [metronome, bpm, preset, gap, repeat])
  const timingKey = JSON.stringify(timing)

  const stop = useCallback(() => {
    engineRef.current?.stop()
    startedKeyRef.current = ''
    setPlaying(false)
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }, [])

  // Called from the Start tap so the AudioContext is created inside a user gesture
  const start = async () => {
    try {
      if (!engineRef.current) {
        engineRef.current = new TempoEngine()
        engineRef.current.onEnd = stop
      }
      startedKeyRef.current = timingKey
      await engineRef.current.start({ ...timing, volume })
      setPlaying(true)
      const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeLock> } }).wakeLock
      wl?.request('screen').then(lock => { wakeLockRef.current = lock }).catch(() => {})
    } catch {
      startedKeyRef.current = ''
      toast.error('Could not start audio on this device')
    }
  }

  // Changing tempo while playing restarts with the new timing
  useEffect(() => {
    if (!playing || startedKeyRef.current === timingKey) return
    startedKeyRef.current = timingKey
    engineRef.current?.start({ ...timing, volume }).catch(stop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timingKey, playing])

  useEffect(() => {
    engineRef.current?.setVolume(volume)
  }, [volume])

  // Stop when the app is backgrounded; tear down on unmount
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      wakeLockRef.current?.release().catch(() => {})
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [stop])

  // Drive the dot and rest countdown from the audio clock
  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return
    // Rest elements are unmounted in metronome mode, so read the refs each time
    const showRest = (fraction: number, seconds: number) => {
      if (restBarRef.current) restBarRef.current.style.width = `${fraction * 100}%`
      if (restLabelRef.current) {
        restLabelRef.current.textContent = seconds > 0 ? `Next rep in ${seconds.toFixed(1)}s` : ''
      }
    }
    if (!playing) {
      dot.style.left = '0%'
      dot.dataset.impact = 'false'
      showRest(0, 0)
      return
    }
    let raf = 0
    const frame = () => {
      const pos = engineRef.current?.getPosition()
      if (pos) {
        dot.style.left = `${pos.position * 100}%`
        dot.dataset.impact = String(pos.impact)
        showRest(pos.restFraction, pos.restLeft)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const strokeMs = Math.round((timing.back + timing.down) * 1000)

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tempo Trainer</h1>
        <p className="text-muted-foreground text-sm">Swing to the tones: takeaway, top, impact</p>
      </div>

      {/* Mode */}
      <Segmented
        label="Shot type"
        options={MODES.map(m => ({ value: m.id, label: m.label }))}
        value={mode}
        onChange={v => update({ mode: v })}
      />

      {mode === 'putting' && (
        <Segmented
          label="Putting cue"
          options={[
            { value: 'tones', label: '3-tone' },
            { value: 'metronome', label: 'Metronome' },
          ]}
          value={puttStyle}
          onChange={v => update({ puttStyle: v })}
        />
      )}

      {/* Visual */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-4xl font-bold font-mono tabular-nums">
            {metronome ? bpm : preset.id}
            {metronome && <span className="text-base font-medium text-muted-foreground ml-2">BPM</span>}
          </p>
          <p className="text-xs text-muted-foreground text-right">
            {metronome ? (
              <>{strokeMs} ms per stroke</>
            ) : (
              <>
                {framesToMs(preset.back)} ms back · {framesToMs(preset.down)} ms down
                <br />
                {modeInfo.ratio} ratio
              </>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <div className="relative h-10 mx-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-muted" />
            <div className="absolute top-1/2 left-0 w-0.5 h-5 -translate-x-1/2 -translate-y-1/2 bg-muted-foreground" />
            <div className="absolute top-1/2 right-0 w-0.5 h-5 translate-x-1/2 -translate-y-1/2 bg-muted-foreground" />
            <div
              ref={dotRef}
              data-impact="false"
              className="absolute top-1/2 w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground data-[impact=true]:bg-primary data-[impact=true]:scale-150 data-[impact=true]:shadow-[0_0_24px_hsl(var(--primary))]"
              style={{ left: '0%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start · Impact</span>
            <span>Top</span>
          </div>
        </div>

        {!metronome && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rest</span>
              <span ref={restLabelRef} className="font-mono tabular-nums" />
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div ref={restBarRef} className="h-full rounded-full bg-primary" style={{ width: '0%' }} />
            </div>
          </div>
        )}

        <button
          onClick={playing ? stop : start}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg py-4 font-medium transition-colors',
            playing
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Tempo */}
      {metronome ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Beats per minute</p>
          <div className="flex items-center justify-between gap-4">
            <button
              aria-label="Decrease BPM"
              disabled={bpm <= BPM_MIN}
              onClick={() => update({ bpm: clampBpm(bpm - 1) })}
              className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-40"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="range"
              aria-label="BPM"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              value={bpm}
              onChange={e => update({ bpm: clampBpm(Number(e.target.value)) })}
              className="flex-1 accent-primary"
            />
            <button
              aria-label="Increase BPM"
              disabled={bpm >= BPM_MAX}
              onClick={() => update({ bpm: clampBpm(bpm + 1) })}
              className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-40"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Start the putter back on the low tick, strike the ball on the high tick. Most tour strokes sit between 72 and 80.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tempo</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS[mode].map(p => {
              const active = p.id === preset.id
              return (
                <button
                  key={p.id}
                  aria-pressed={active}
                  onClick={() => update({ presets: { ...presets, [mode]: p.id } })}
                  className={cn(
                    'rounded-lg py-3 text-center font-semibold font-mono transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {p.id}
                </button>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground">{modeInfo.help}</p>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {!metronome && (
          <>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <span className="text-sm">Repeat</span>
              <button
                role="switch"
                aria-checked={repeat}
                aria-label="Repeat"
                onClick={() => update({ repeat: !repeat })}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  repeat ? 'bg-primary' : 'bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 left-1 w-5 h-5 rounded-full bg-foreground transition-transform',
                    repeat && 'translate-x-5'
                  )}
                />
              </button>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <span className="text-sm">Rest between reps</span>
              <div className="flex gap-2">
                {GAP_OPTIONS.map(g => (
                  <button
                    key={g}
                    aria-pressed={g === gap}
                    onClick={() => update({ gap: g })}
                    className={cn(
                      'w-12 py-2 rounded-lg text-sm font-medium transition-colors',
                      g === gap ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {g}s
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <label htmlFor="tempo-volume" className="text-sm">Volume</label>
          <input
            id="tempo-volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => update({ volume: Number(e.target.value) })}
            className="w-40 accent-primary"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        No sound on iPhone? Turn off silent mode and turn the volume up.
      </p>
    </div>
  )
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg bg-secondary p-1 gap-1">
      {options.map(o => (
        <button
          key={o.value}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
            o.value === value ? 'bg-background text-foreground' : 'text-muted-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
