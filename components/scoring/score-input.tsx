'use client'

import { useState } from 'react'
import { Numpad } from '@/components/scoring/numpad'
import { clampScore } from '@/lib/utils'
import type { Drill } from '@/lib/types'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreInputProps {
  drill: Drill
  value: number
  onChange: (val: number) => void
}

export function ScoreInput({ drill, value, onChange }: ScoreInputProps) {
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [numpadStr, setNumpadStr] = useState('')
  // Drives the small tick animation on the number; key changes restart it
  const [tick, setTick] = useState<{ dir: 'up' | 'down'; n: number }>({ dir: 'up', n: 0 })

  const min = drill.min_score
  const max = drill.max_score

  function adjust(delta: number) {
    const next = clampScore(value + delta, min, max)
    if (next === value) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
      return
    }
    setTick((t) => ({ dir: delta > 0 ? 'up' : 'down', n: t.n + 1 }))
    onChange(next)
  }

  function openNumpad() {
    setNumpadStr(value.toString())
    setNumpadOpen(true)
  }

  function closeNumpad() {
    const parsed = parseFloat(numpadStr)
    if (!isNaN(parsed)) {
      onChange(clampScore(parsed, min, max))
    }
    setNumpadOpen(false)
    setNumpadStr('')
  }

  const atMin = value <= min
  const atMax = max !== null && value >= max
  const bounds = [max !== null && `max ${max}`, min !== 0 && `min ${min}`].filter(Boolean).join(' · ')

  return (
    <>
      <div className="flex w-full max-w-sm items-center justify-between gap-2">
        <StepButton label="Decrease" disabled={atMin} onPress={() => adjust(-1)}>
          <Minus className="h-7 w-7" strokeWidth={2.5} />
        </StepButton>

        <button
          onPointerDown={(e) => { e.preventDefault(); openNumpad() }}
          className="flex min-w-0 flex-1 flex-col items-center select-none"
          aria-label={`Score ${value} ${drill.unit}. Tap to type a score`}
          style={{ WebkitUserSelect: 'none' }}
        >
          <span
            key={tick.n}
            className={cn('numeral block text-[96px] leading-[0.9]', tick.n > 0 && (tick.dir === 'up' ? 'animate-tick-up' : 'animate-tick-down'))}
          >
            {value}
          </span>
          <span className="mt-2 text-sm text-muted-foreground">{drill.unit}</span>
        </button>

        <StepButton label="Increase" disabled={atMax} onPress={() => adjust(1)}>
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </StepButton>
      </div>

      <p className="label normal-case tracking-normal">
        Tap the number to type{bounds && ` · ${bounds}`}
      </p>

      {numpadOpen && (
        <>
          <div className="fixed inset-0 z-[55] bg-ink/30" onPointerDown={closeNumpad} />
          <div className="fixed inset-x-0 bottom-0 z-[60]">
            <div className="mx-auto flex max-w-lg items-baseline justify-between rounded-t-2xl border-t bg-card px-5 pt-4">
              <p className="label">Score · {drill.unit}</p>
              <p className="numeral text-5xl">{numpadStr || '0'}</p>
            </div>
            <Numpad
              value={numpadStr}
              onChange={setNumpadStr}
              onDone={closeNumpad}
              allowNegative={drill.min_score < 0}
            />
          </div>
        </>
      )}
    </>
  )
}

function StepButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onPress() }}
      disabled={disabled}
      aria-label={label}
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 border-input bg-card text-foreground transition-transform select-none active:scale-95 active:bg-accent disabled:opacity-30"
      style={{ WebkitUserSelect: 'none' }}
    >
      {children}
    </button>
  )
}
