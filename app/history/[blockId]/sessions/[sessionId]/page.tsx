import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionWithDrills } from '@/lib/queries/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatScoreWithUnit } from '@/lib/utils'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ blockId: string; sessionId: string }>
}) {
  const { blockId, sessionId } = await params
  const session = await getSessionWithDrills(sessionId)
  if (!session || session.block_id !== blockId) notFound()

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground">
            History
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/history/${blockId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {session.block.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">Session {session.session_number}</span>
        </div>
        <h1 className="text-2xl font-bold">Session {session.session_number}</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(session.session_date)}</p>
      </div>

      {session.notes && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm italic text-muted-foreground">&ldquo;{session.notes}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Drill Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {session.drills.map((sd, i) => (
            <div key={sd.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-sm">{sd.drill.name}</p>
                  <p className="text-xs text-muted-foreground">{sd.drill.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">
                    {sd.score !== null ? sd.score : '—'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {sd.drill.scoring_direction === 'higher_better' ? '↑' : '↓'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
