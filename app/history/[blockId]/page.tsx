import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlock } from '@/lib/queries/blocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BlockCompletionSummary } from '@/components/block-completion-summary'
import { formatDate, formatScoreWithUnit } from '@/lib/utils'

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ blockId: string }>
}) {
  const { blockId } = await params
  const block = await getBlock(blockId)
  if (!block) notFound()

  const totalDays = block.day_logs.length

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground">
            History
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">{block.name}</span>
        </div>
        <h1 className="text-2xl font-bold">{block.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(block.started_at)}
          {block.completed_at && ` → ${formatDate(block.completed_at)}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalDays} of {block.target_days} days logged
        </p>
      </div>

      {/* Completion summary for finished blocks with ≥2 days */}
      {block.status === 'completed' && block.day_logs.length >= 2 && (
        <BlockCompletionSummary block={block} />
      )}

      {/* Day-grouped drill logs (newest first) */}
      {block.day_logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No drills logged yet.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Drill Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {block.day_logs.map((dayLog, i) => (
              <div key={dayLog.log_date}>
                {i > 0 && <Separator />}
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold mb-2">{formatDate(dayLog.log_date)}</p>
                  <div className="space-y-1.5">
                    {dayLog.drills.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{entry.drill.name}</span>
                        {entry.skipped ? (
                          <Badge variant="secondary" className="text-xs">Skipped</Badge>
                        ) : (
                          <span className="text-sm font-mono font-semibold">
                            {formatScoreWithUnit(entry.score, entry.drill.unit)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
