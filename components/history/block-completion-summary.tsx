'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Block Complete!</CardTitle>
        <p className="text-sm text-muted-foreground">
          {day_logs.length} days completed — here&apos;s your progress:
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {summaries.map((s) => {
          if (!s) return null
          return (
            <div key={s.drill.id} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.drill.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.firstScore} → {s.lastScore} {s.drill.unit}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {s.personalBest !== null && (
                  <Badge variant="outline" className="text-xs">
                    Best: {s.personalBest}
                  </Badge>
                )}
                <span className="text-lg">
                  {s.trend === 'better' ? '↑' : s.trend === 'worse' ? '↓' : '→'}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
