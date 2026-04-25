import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlock } from '@/lib/queries/blocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BlockCompletionSummary } from '@/components/block-completion-summary'
import { formatDate, formatScoreWithUnit } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ blockId: string }>
}) {
  const { blockId } = await params
  const block = await getBlock(blockId)
  if (!block) notFound()

  const completedSessions = block.sessions.filter((s) => s.status === 'completed')

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
      </div>

      {/* Completion summary for finished blocks */}
      {block.status === 'completed' && completedSessions.length >= 2 && (
        <BlockCompletionSummary sessions={completedSessions} />
      )}

      {/* Sessions list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Sessions ({completedSessions.length}/{block.session_count})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {block.sessions.map((session, i) => (
            <div key={session.id}>
              {i > 0 && <Separator />}
              {session.status === 'completed' ? (
                <Link href={`/history/${blockId}/sessions/${session.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">Session {session.session_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.session_date)}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          &ldquo;{session.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Done</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">Session {session.session_number}</p>
                    <p className="text-sm text-muted-foreground">In progress</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
