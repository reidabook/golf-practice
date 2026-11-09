'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FOCUS_AREAS, PREROUND_STEPS, RANGE_PHASES, REFERENCE_DRILLS } from '@/lib/plan-content'
import { SectionLabel } from '@/components/ui/page'
import { cn } from '@/lib/utils'

function Disclosure({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          {meta && <span className="block text-sm text-muted-foreground">{meta}</span>}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function Guides() {
  const [showAllFocus, setShowAllFocus] = useState(false)
  const focus = showAllFocus ? FOCUS_AREAS : FOCUS_AREAS.slice(0, 3)

  return (
    <div className="space-y-7">
      <section>
        <SectionLabel trailing="Most persistent first">Current focus</SectionLabel>
        <ol className="overflow-hidden rounded-lg border bg-card">
          {focus.map(({ rank, area, note }) => (
            <li key={rank} className="flex gap-3 border-b px-4 py-3 last:border-b-0">
              <span className="numeral w-5 shrink-0 text-lg leading-6 text-muted-foreground">{rank}</span>
              <span className="min-w-0">
                <span className="block font-bold leading-snug">{area}</span>
                <span className="block text-sm text-muted-foreground">{note}</span>
              </span>
            </li>
          ))}
        </ol>
        <button onClick={() => setShowAllFocus((v) => !v)} className="mt-2 w-full px-1 text-right text-sm font-bold text-fairway">
          {showAllFocus ? 'Show top 3' : `Show all ${FOCUS_AREAS.length}`}
        </button>
      </section>

      <section>
        <SectionLabel>Sessions</SectionLabel>
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          <Disclosure title="Range session" meta="1–2× a week · about 60 balls" defaultOpen>
            <ol className="space-y-4">
              {RANGE_PHASES.map((phase) => (
                <li key={phase.label}>
                  <p className="font-bold">{phase.label}</p>
                  <p className="label mb-1.5 normal-case tracking-normal">{phase.balls}</p>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[15px] leading-snug">
                        <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-rough" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Disclosure>
          <Disclosure title="Pre-round warmup" meta="10 minutes">
            <ol className="space-y-2">
              {PREROUND_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-[15px]">
                  <span className="numeral w-4 shrink-0 text-muted-foreground">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Disclosure>
        </div>
      </section>

      <section>
        <SectionLabel>Drill reference</SectionLabel>
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          {REFERENCE_DRILLS.map((drill) => (
            <Disclosure
              key={drill.id}
              title={
                <span className="flex items-center gap-2">
                  {drill.name}
                  {drill.homeOnly && <span className="label rounded bg-muted px-1.5 py-0.5 text-[10px]">Home</span>}
                </span>
              }
              meta={drill.trains}
            >
              <ol className="space-y-2.5">
                {drill.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-snug">
                    <span className="numeral w-4 shrink-0 text-muted-foreground">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-l-[3px] border-flag pl-3 text-sm">
                <span className="font-bold">Checkpoint. </span>
                {drill.checkpoint}
              </p>
            </Disclosure>
          ))}
        </div>
      </section>
    </div>
  )
}
