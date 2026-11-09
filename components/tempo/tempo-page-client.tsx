'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Play, Plus, Square } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TempoEngine } from '@/lib/tempo-audio'
import { SwingDial } from '@/components/tempo/swing-dial'
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

  const strokeMs = Math.round((timing.back + timing.down) * 1000)

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="screen-title">Tempo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Swing to the tones: takeaway, top, impact</p>
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
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="numeral text-5xl leading-none">
            {metronome ? bpm : preset.id}
            {metronome && <span className="label ml-2">BPM</span>}
          </p>
          <p className="label text-right normal-case leading-snug tracking-normal">
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

        <SwingDial engineRef={engineRef} playing={playing} mode={mode} showCountdown={!metronome} />

        <button
          onClick={playing ? stop : start}
          className={cn(
            'flex h-14 w-full items-center justify-center gap-2 rounded-lg text-base font-bold transition-[background-color,transform] active:scale-[0.98]',
            playing
              ? 'bg-ink text-chalk'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {playing ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          {playing ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Tempo */}
      {metronome ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="label">Beats per minute</p>
          <div className="flex items-center justify-between gap-4">
            <button
              aria-label="Decrease BPM"
              disabled={bpm <= BPM_MIN}
              onClick={() => update({ bpm: clampBpm(bpm - 1) })}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-input bg-card disabled:opacity-30"
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
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-input bg-card disabled:opacity-30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Start the putter back on the low tick, strike the ball on the high tick. Most tour strokes sit between 72 and 80.
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="label">Tempo · back/down frames</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS[mode].map(p => {
              const active = p.id === preset.id
              return (
                <button
                  key={p.id}
                  aria-pressed={active}
                  onClick={() => update({ presets: { ...presets, [mode]: p.id } })}
                  className={cn(
                    'numeral h-12 rounded-lg text-center text-lg transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'border bg-card text-foreground'
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
      <div className="divide-y rounded-lg border bg-card">
        {!metronome && (
          <>
            <div className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="font-bold">Repeat</span>
              <button
                role="switch"
                aria-checked={repeat}
                aria-label="Repeat"
                onClick={() => update({ repeat: !repeat })}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  repeat ? 'bg-primary' : 'bg-input'
                )}
              >
                <span
                  className={cn(
                    'absolute left-1 top-1 h-5 w-5 rounded-full bg-card shadow transition-transform',
                    repeat && 'translate-x-5'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="font-bold">Rest between reps</span>
              <div className="flex gap-2">
                {GAP_OPTIONS.map(g => (
                  <button
                    key={g}
                    aria-pressed={g === gap}
                    onClick={() => update({ gap: g })}
                    className={cn(
                      'numeral h-10 w-12 rounded-lg text-sm transition-colors',
                      g === gap ? 'bg-primary text-primary-foreground' : 'border bg-card text-foreground'
                    )}
                  >
                    {g}s
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <label htmlFor="tempo-volume" className="font-bold">Volume</label>
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

      <p className="text-center text-xs text-muted-foreground">
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
    <div role="group" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map(o => (
        <button
          key={o.value}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-10 flex-1 rounded-md text-sm font-bold transition-colors',
            o.value === value ? 'bg-card text-foreground shadow-sm dark:bg-accent' : 'text-muted-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
