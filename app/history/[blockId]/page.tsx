import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getBlock } from '@/lib/queries/blocks'
import { BlockCompletionSummary } from '@/components/history/block-completion-summary'
import { ScorecardStrip } from '@/components/ui/scorecard-strip'
import { MarkLegend, SectionLabel } from '@/components/ui/page'
import { formatDate } from '@/lib/utils'
import type { Drill } from '@/lib/types'

const STATUS_LABEL = { active: 'Running', completed: 'Done', ended_early: 'Ended early' } as const

export default async function BlockDetailPage({ params }: { params: Promise<{ blockId: string }> }) {
  const { blockId } = await params
  const block = await getBlock(blockId)
  if (!block) notFound()

  const totalDays = block.day_logs.length

  // Per-drill scores, oldest first, for the scorecard strips
  const byDrill = new Map<string, { drill: Drill; scores: number[] }>()
  for (const day of [...block.day_logs].reverse()) {
    for (const log of [...day.drills].reverse()) {
      if (log.skipped || log.score === null) continue
      const entry = byDrill.get(log.drill_id) ?? { drill: log.drill, scores: [] }
      entry.scores.push(log.score)
      byDrill.set(log.drill_id, entry)
    }
  }

  return (
    <div>
      <header className="px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href="/progress#blocks" className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-md px-2 font-bold text-muted-foreground active:bg-accent">
          <ArrowLeft className="h-5 w-5" />
          Progress
        </Link>
        <p className="label mt-2">{STATUS_LABEL[block.status]}</p>
        <h1 className="screen-title mt-1 text-balance">{block.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(block.started_at)}
          {block.completed_at && ` – ${formatDate(block.completed_at)}`} · {totalDays} day{totalDays !== 1 ? 's' : ''} logged · {block.target_sessions} session target
        </p>
      </header>

      <div className="space-y-8 px-4">
        {(block.status === 'completed' || block.status === 'ended_early') && block.day_logs.length >= 2 && (
          <BlockCompletionSummary block={block} />
        )}

        {byDrill.size > 0 && (
          <section>
            <SectionLabel trailing={<MarkLegend />}>Scorecard</SectionLabel>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {[...byDrill.values()].map(({ drill, scores }) => (
                <div key={drill.id} className="px-4 py-3.5">
                  <p className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="truncate font-bold">{drill.name}</span>
                    <span className="label shrink-0 normal-case tracking-normal">
                      {drill.unit} {drill.scoring_direction === 'lower_better' ? '↓' : '↑'}
                    </span>
                  </p>
                  <ScorecardStrip
                    scores={scores}
                    total={Math.max(block.target_sessions, scores.length)}
                    direction={drill.scoring_direction}
                    unit={drill.unit}
                    showBest
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionLabel>By day</SectionLabel>
          {block.day_logs.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing logged in this block yet.
            </p>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {block.day_logs.map((dayLog) => (
                <div key={dayLog.log_date} className="px-4 py-3.5">
                  <p className="label mb-2">{formatDate(dayLog.log_date)}</p>
                  <ul className="space-y-1.5">
                    {dayLog.drills.map((entry) => (
                      <li key={entry.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                        <span className="truncate">{entry.drill.name}</span>
                        {entry.skipped ? (
                          <span className="label">Skipped</span>
                        ) : (
                          <span className="shrink-0">
                            <span className="numeral">{entry.score}</span>{' '}
                            <span className="text-sm text-muted-foreground">{entry.drill.unit}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
