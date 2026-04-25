'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SessionWithHistory } from '@/lib/types'

interface BlockCompletionSummaryProps {
  sessions: SessionWithHistory[]
}

export function BlockCompletionSummary({ sessions: rawSessions }: BlockCompletionSummaryProps) {
  const sessions = [...rawSessions].sort((a, b) => a.session_number - b.session_number)
  if (sessions.length < 2) return null

  const first = sessions[0]
  const last = sessions[sessions.length - 1]

  // Build per-drill summary
  const drillIds = first.drills.map((d) => d.drill_id)
  const summaries = drillIds.map((drillId) => {
    const firstEntry = first.drills.find((d) => d.drill_id === drillId)
    const lastEntry = last.drills.find((d) => d.drill_id === drillId)
    if (!firstEntry || !lastEntry) return null

    const drill = firstEntry.drill
    const firstScore = firstEntry.score
    const lastScore = lastEntry.score

    // Personal best across all sessions
    const allScores = sessions
      .flatMap((s) => s.drills.filter((d) => d.drill_id === drillId))
      .map((d) => d.score)
      .filter((s): s is number => s !== null)

    const personalBest =
      allScores.length > 0
        ? drill.scoring_direction === 'higher_better'
          ? Math.max(...allScores)
          : Math.min(...allScores)
        : null

    let trend: 'better' | 'worse' | 'same' | 'unknown' = 'unknown'
    if (firstScore !== null && lastScore !== null) {
      const improved =
        drill.scoring_direction === 'higher_better'
          ? lastScore > firstScore
          : lastScore < firstScore
      const same = lastScore === firstScore
      trend = same ? 'same' : improved ? 'better' : 'worse'
    }

    return { drill, firstScore, lastScore, personalBest, trend }
  }).filter(Boolean)

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🏆 Block Complete!</CardTitle>
        <p className="text-sm text-muted-foreground">
          {sessions.length} sessions completed — here&apos;s your progress:
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {summaries.map((s) => {
          if (!s) return null
          return (
            <div
              key={s.drill.id}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.drill.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.firstScore ?? '—'} → {s.lastScore ?? '—'} {s.drill.unit}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {s.personalBest !== null && (
                  <Badge variant="outline" className="text-xs">
                    Best: {s.personalBest}
                  </Badge>
                )}
                <span className="text-lg">
                  {s.trend === 'better' ? '📈' : s.trend === 'worse' ? '📉' : '➡️'}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
