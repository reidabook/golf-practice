export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getActiveBlocks } from '@/lib/queries/blocks'
import { getTemplates } from '@/lib/queries/templates'
import { startBlock } from '@/lib/actions/blocks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils'

export default async function Home() {
  const [activeBlocks, templates] = await Promise.all([getActiveBlocks(), getTemplates()])

  return (
    <div className="p-4 space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <h1 className="text-2xl font-bold">Golf Practice</h1>

      {/* Active training blocks */}
      {activeBlocks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Active</h2>
          {activeBlocks.map(({ block, completed_drills, total_drills, todays_drill_count }) => {
            const progressPct = total_drills > 0 ? Math.round((completed_drills / total_drills) * 100) : 0
            return (
              <Card key={block.id}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <p className="font-semibold">{block.name}</p>
                    <p className="text-xs text-muted-foreground">Started {formatDate(block.started_at)}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completed_drills} of {total_drills} drills</span>
                      <span>{total_drills - completed_drills} remaining</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                  {todays_drill_count > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {todays_drill_count} drill{todays_drill_count !== 1 ? 's' : ''} logged today
                    </p>
                  )}
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/blocks/${block.id}/drills`}>Open Training</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}

      {/* Template picker — always visible so any template can be started */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start a Training Block</CardTitle>
          <CardDescription>Choose a template to begin your program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet.{' '}
              <Link href="/drills" className="underline text-primary">
                Create one in Drills
              </Link>
            </p>
          ) : (
            templates.map((t) => (
              <form
                key={t.id}
                action={async () => {
                  'use server'
                  await startBlock(t.id)
                }}
              >
                <button
                  type="submit"
                  className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{t.target_sessions} sessions</p>
                    </div>
                    {t.is_default && <Badge variant="secondary">Default</Badge>}
                  </div>
                </button>
              </form>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
