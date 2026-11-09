'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DrillProgress } from '@/lib/types'
import { ScorecardStrip } from '@/components/ui/scorecard-strip'
import { ProgressChartClient } from '@/components/progress/progress-chart-client'
import { cn } from '@/lib/utils'

const RECENT = 8

/** One row per drill: latest score + the last 8 scores as a scorecard strip. Tap for the full chart. */
export function DrillProgressList({ items }: { items: DrillProgress[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="divide-y overflow-hidden rounded-lg border bg-card">
      {items.map((dp) => {
        const scores = dp.dataPoints.map((p) => p.score)
        const recent = scores.slice(-RECENT)
        const latest = scores[scores.length - 1]
        const isOpen = open === dp.drill.id
        return (
          <div key={dp.drill.id}>
            <button
              onClick={() => setOpen(isOpen ? null : dp.drill.id)}
              aria-expanded={isOpen}
              className="block w-full px-4 py-3.5 text-left"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-bold">{dp.drill.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {dp.drill.unit} · {dp.drill.scoring_direction === 'higher_better' ? '↑ higher is better' : '↓ lower is better'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-right">
                    <span className="numeral block text-2xl leading-none">{latest}</span>
                    <span className="label text-[10px]">Latest</span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                </span>
              </span>
              <ScorecardStrip
                className="mt-2.5"
                scores={recent}
                direction={dp.drill.scoring_direction}
                unit={dp.drill.unit}
                size="sm"
                showBest
              />
              {scores.length > RECENT && (
                <span className="label mt-1.5 block normal-case tracking-normal">Last {RECENT} of {scores.length} scores</span>
              )}
            </button>
            {isOpen && (
              <div className="px-2 pb-3">
                <ProgressChartClient progress={dp} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
