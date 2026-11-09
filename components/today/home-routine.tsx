'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { HOME_ITEMS } from '@/lib/plan-content'
import { cn } from '@/lib/utils'

// Per-day checklist; same key as the old Plan tab so today's ticks carry over
function todayKey() {
  return `plan-checklist-${new Date().toISOString().slice(0, 10)}`
}

export function HomeRoutine() {
  const [checked, setChecked] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(todayKey())
      setChecked(stored ? JSON.parse(stored) : [])
    } catch {
      setChecked([])
    }
  }, [])

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try { localStorage.setItem(todayKey(), JSON.stringify(next)) } catch {}
      return next
    })
  }

  const done = HOME_ITEMS.filter((i) => checked.includes(i.id)).length
  const allDone = done === HOME_ITEMS.length

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold">Home routine</p>
          <p className="text-sm text-muted-foreground">About 10 min · no ball needed</p>
        </div>
        <span className={cn('numeral text-sm', allDone ? 'text-fairway' : 'text-muted-foreground')}>
          {done}/{HOME_ITEMS.length}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-y divide-border border-t">
          {HOME_ITEMS.map((item) => {
            const isDone = checked.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  onClick={() => toggle(item.id)}
                  aria-pressed={isDone}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2',
                      isDone ? 'border-fairway bg-fairway text-primary-foreground' : 'border-input'
                    )}
                  >
                    {isDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('flex items-baseline justify-between gap-2 font-bold', isDone && 'text-muted-foreground line-through')}>
                      {item.label}
                      <span className="label shrink-0 no-underline">{item.duration}</span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{item.detail}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
