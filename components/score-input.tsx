'use client'

import { useState } from 'react'
import { Numpad } from '@/components/numpad'
import { clampScore } from '@/lib/utils'
import type { Drill } from '@/lib/types'
import { Minus, Plus } from 'lucide-react'

interface ScoreInputProps {
  drill: Drill
  value: number
  onChange: (val: number) => void
}

export function ScoreInput({ drill, value, onChange }: ScoreInputProps) {
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [numpadStr, setNumpadStr] = useState('')

  const min = drill.min_score
  const max = drill.max_score

  function adjust(delta: number) {
    const next = clampScore(value + delta, min, max)
    if (next === value && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }
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

  function handleNumpadChange(val: string) {
    setNumpadStr(val)
  }

  const atMin = value <= min
  const atMax = max !== null && value >= max

  return (
    <>
      <div className="flex items-center justify-center gap-6">
        <button
          onPointerDown={(e) => { e.preventDefault(); adjust(-1) }}
          disabled={atMin}
          className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground disabled:opacity-30 active:bg-accent transition-colors select-none"
          aria-label="Decrease"
          style={{ WebkitUserSelect: 'none' }}
        >
          <Minus className="w-7 h-7" />
        </button>

        <button
          onPointerDown={(e) => { e.preventDefault(); openNumpad() }}
          className="min-w-[6rem] text-center select-none"
          aria-label="Tap to type score"
          style={{ WebkitUserSelect: 'none' }}
        >
          <span className="text-7xl font-bold tabular-nums leading-none">{value}</span>
        </button>

        <button
          onPointerDown={(e) => { e.preventDefault(); adjust(1) }}
          disabled={atMax}
          className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground disabled:opacity-30 active:bg-accent transition-colors select-none"
          aria-label="Increase"
          style={{ WebkitUserSelect: 'none' }}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {drill.unit}
        {max !== null && ` • max ${max}`}
        {min !== 0 && ` • min ${min}`}
      </p>

      {numpadOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onPointerDown={closeNumpad}
          />
          <div className="fixed inset-x-0 bottom-0 z-50">
            {/* Preview */}
            <div className="bg-background border-t border-border px-4 py-3 max-w-lg mx-auto">
              <p className="text-sm text-muted-foreground">Entering score</p>
              <p className="text-4xl font-bold tabular-nums">{numpadStr || '0'}</p>
            </div>
            <Numpad
              value={numpadStr}
              onChange={handleNumpadChange}
              onDone={closeNumpad}
              allowNegative={drill.min_score < 0}
            />
          </div>
        </>
      )}
    </>
  )
}
