import Link from 'next/link'
import { getBlocks } from '@/lib/queries/blocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function HistoryPage() {
  const blocks = await getBlocks()

  if (blocks.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-4xl mb-4">📋</p>
        <h2 className="text-xl font-semibold mb-2">No history yet</h2>
        <p className="text-muted-foreground text-sm">
          Complete your first training session to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">History</h1>

      <div className="space-y-3">
        {blocks.map((block) => (
          <Link key={block.id} href={`/history/${block.id}`}>
            <Card className="hover:bg-accent transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{block.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={block.status === 'completed' ? 'default' : 'secondary'}>
                      {block.status === 'completed' ? 'Done' : 'Active'}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {formatDate(block.started_at)}
                  {block.completed_at && ` → ${formatDate(block.completed_at)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {block.session_count} sessions
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
