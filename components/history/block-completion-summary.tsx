'use client'

import { SectionLabel } from '@/components/ui/page'
import { cn } from '@/lib/utils'
import type { BlockWithDayLogs } from '@/lib/types'

interface BlockCompletionSummaryProps {
  block: BlockWithDayLogs
}

export function BlockCompletionSummary({ block }: BlockCompletionSummaryProps) {
  const { day_logs } = block
  if (day_logs.length < 2) return null

  // day_logs is ordered newest first; first day = last entry, last day = first entry
  const firstDay = day_logs[day_logs.length - 1]
  const lastDay = day_logs[0]

  // Collect all scored (non-skipped) drill logs across all days
  const allLogs = day_logs.flatMap((d) => d.drills).filter((l) => !l.skipped && l.score !== null)

  // Unique drill IDs present in first day's scored logs
  const drillIds = [...new Set(
    firstDay.drills.filter((l) => !l.skipped && l.score !== null).map((l) => l.drill_id)
  )]

  const summaries = drillIds.map((drillId) => {
    const firstEntry = firstDay.drills.find((l) => l.drill_id === drillId && !l.skipped && l.score !== null)
    const lastEntry = lastDay.drills.find((l) => l.drill_id === drillId && !l.skipped && l.score !== null)
    if (!firstEntry || !lastEntry) return null

    const drill = firstEntry.drill
    const firstScore = firstEntry.score as number
    const lastScore = lastEntry.score as number

    const allScoresForDrill = allLogs
      .filter((l) => l.drill_id === drillId)
      .map((l) => l.score as number)

    const personalBest =
      allScoresForDrill.length > 0
        ? drill.scoring_direction === 'higher_better'
          ? Math.max(...allScoresForDrill)
          : Math.min(...allScoresForDrill)
        : null

    const improved =
      drill.scoring_direction === 'higher_better'
        ? lastScore > firstScore
        : lastScore < firstScore
    const same = lastScore === firstScore
    const trend: 'better' | 'worse' | 'same' = same ? 'same' : improved ? 'better' : 'worse'

    return { drill, firstScore, lastScore, personalBest, trend }
  }).filter(Boolean)

  if (summaries.length === 0) return null

  return (
    <section>
      <SectionLabel trailing={`${day_logs.length} days`}>First day vs last day</SectionLabel>
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {summaries.map((s) => {
          if (!s) return null
          return (
            <div key={s.drill.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{s.drill.name}</p>
                <p className="text-sm text-muted-foreground">
                  Best <span className="numeral text-foreground">{s.personalBest ?? '—'}</span> {s.drill.unit}
                </p>
              </div>
              <p className="numeral shrink-0 text-lg">
                <span className="text-muted-foreground">{s.firstScore}</span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className={cn(s.trend === 'better' && 'text-fairway', s.trend === 'worse' && 'text-stripe')}>{s.lastScore}</span>
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
