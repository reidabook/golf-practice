'use client'

import { cn } from '@/lib/utils'

interface NumpadProps {
  value: string
  onChange: (val: string) => void
  onDone: () => void
  allowNegative?: boolean
}

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '⌫']

export function Numpad({ value, onChange, onDone, allowNegative = false }: NumpadProps) {
  function handleKey(key: string) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }
    if (key === '⌫') {
      onChange(value.slice(0, -1) || '')
    } else if (key === '-') {
      if (!allowNegative) return
      if (value.startsWith('-')) {
        onChange(value.slice(1))
      } else {
        onChange('-' + value)
      }
    } else {
      // Prevent multiple digits that would form an invalid number
      const next = value + key
      // Allow up to 4 digits
      if (next.replace('-', '').length > 4) return
      onChange(next)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border">
      <div className="max-w-lg mx-auto">
        {/* Done bar */}
        <div className="flex justify-end px-4 pt-3 pb-2">
          <button
            onClick={onDone}
            className="text-primary font-semibold text-base px-2"
          >
            Done
          </button>
        </div>

        {/* Keypad grid */}
        <div className="grid grid-cols-3 gap-px bg-border mb-safe">
          {KEYS.map((key) => {
            const isDisabled = key === '-' && !allowNegative
            return (
              <button
                key={key}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (!isDisabled) handleKey(key)
                }}
                className={cn(
                  'bg-background text-foreground text-2xl font-medium py-5 active:bg-accent transition-colors select-none',
                  isDisabled && 'opacity-20 cursor-not-allowed',
                  key === '⌫' && 'text-xl'
                )}
                style={{ WebkitUserSelect: 'none' }}
              >
                {key}
              </button>
            )
          })}
        </div>

        {/* Safe area bottom padding */}
        <div style={{ height: 'max(0px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
