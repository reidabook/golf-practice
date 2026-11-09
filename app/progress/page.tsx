export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getProgressForAllDrills } from '@/lib/queries/progress'
import { getHandicapHistory } from '@/lib/queries/handicap'
import { getBlocks } from '@/lib/queries/blocks'
import { syncHandicapToday } from '@/lib/utils/ghin-sync'
import { HandicapChartClient } from '@/components/progress/handicap-chart-client'
import { DrillProgressList } from '@/components/progress/drill-progress-list'
import { MarkLegend, PageHeader, SectionLabel } from '@/components/ui/page'
import { formatDate, cn } from '@/lib/utils'
import type { TrainingBlock } from '@/lib/types'

const STATUS: Record<TrainingBlock['status'], { label: string; className: string }> = {
  active: { label: 'Running', className: 'bg-flag text-flag-ink' },
  completed: { label: 'Done', className: 'bg-fairway text-primary-foreground' },
  ended_early: { label: 'Ended early', className: 'bg-muted text-muted-foreground' },
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function ProgressPage() {
  const [syncResult, drillProgress, handicapHistory, blocks] = await Promise.all([
    syncHandicapToday(),
    getProgressForAllDrills(),
    getHandicapHistory(),
    getBlocks(),
  ])

  const hasHandicapData = handicapHistory.length > 0
  const hasDrillData = drillProgress.length > 0
  const current = handicapHistory.at(-1)
  const first = handicapHistory[0]
  const delta = current && first ? Math.round((current.handicap_index - first.handicap_index) * 10) / 10 : 0

  return (
    <div>
      <PageHeader title="Progress" />
      <div className="space-y-8 px-4">
        {!syncResult.ok && (
          <div className="rounded-lg border-l-4 border-flag bg-flag/15 px-4 py-3 text-sm">
            <p className="font-bold">Handicap didn&apos;t update from GHIN</p>
            <p className="text-muted-foreground">Showing the last saved index. Details are in the Vercel logs.</p>
            {syncResult.error && <p className="mt-1 text-xs text-muted-foreground">{syncResult.error}</p>}
          </div>
        )}

        {!hasHandicapData && !hasDrillData && (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No scores yet. Score a drill on{' '}
            <Link href="/" className="font-bold text-fairway underline underline-offset-4">Today</Link>{' '}
            and its chart shows up here.
          </p>
        )}

        {hasHandicapData && current && (
          <section>
            <SectionLabel trailing="Lower is better">Handicap index</SectionLabel>
            <div className="rounded-lg border bg-card px-4 pt-4">
              <div className="flex items-end justify-between gap-3">
                <span className="numeral text-[56px] leading-[0.9]">{current.handicap_index.toFixed(1)}</span>
                {handicapHistory.length > 1 && delta !== 0 && (
                  <span className={cn('pb-1 text-right text-sm font-bold', delta < 0 ? 'text-fairway' : 'text-stripe')}>
                    {delta < 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(1)}
                    <span className="block text-xs font-normal text-muted-foreground">since {shortDate(first.snapshot_date)}</span>
                  </span>
                )}
              </div>
              <HandicapChartClient snapshots={handicapHistory} />
            </div>
          </section>
        )}

        {(hasDrillData || hasHandicapData) && (
          <section>
            <SectionLabel trailing={<MarkLegend />}>Drills</SectionLabel>
            {hasDrillData ? (
              <DrillProgressList items={drillProgress} />
            ) : (
              <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Score a drill on Today to see it here.
              </p>
            )}
          </section>
        )}

        {blocks.length > 0 && (
          <section id="blocks" className="scroll-mt-4">
            <SectionLabel>Past blocks</SectionLabel>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {blocks.map((block) => (
                <Link key={block.id} href={`/history/${block.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-accent">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{block.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {formatDate(block.started_at)}
                      {block.completed_at && ` – ${formatDate(block.completed_at)}`} · {block.target_sessions} sessions
                    </span>
                  </span>
                  <span className={cn('label shrink-0 rounded px-1.5 py-0.5 text-[10px]', STATUS[block.status].className)}>
                    {STATUS[block.status].label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
