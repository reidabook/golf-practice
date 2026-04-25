import Link from 'next/link'
import { getActiveBlock } from '@/lib/queries/blocks'
import { getTemplates } from '@/lib/queries/templates'
import { startBlock } from '@/lib/actions/blocks'
import { createSession } from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatScoreWithUnit } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function Home() {
  const [activeInfo, templates] = await Promise.all([getActiveBlock(), getTemplates()])

  // --- No active block ---
  if (!activeInfo) {
    return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Golf Practice</h1>
          <p className="text-muted-foreground text-sm mt-1">No active training block</p>
        </div>

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
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.session_count} sessions
                        </p>
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

  const { block, inProgressSession, completedCount, lastSessionDrills } = activeInfo
  const progressPct = Math.round((completedCount / block.session_count) * 100)
  const nextSessionNumber = completedCount + (inProgressSession ? 0 : 1)

  return (
    <div className="p-4 space-y-4">
      {/* Block header */}
      <div>
        <h1 className="text-2xl font-bold">{block.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Session {Math.min(completedCount + 1, block.session_count)} of {block.session_count} •{' '}
          {formatDate(block.started_at)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedCount} completed</span>
          <span>{block.session_count - completedCount} remaining</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* CTA card */}
      <Card>
        <CardContent className="pt-6 pb-4 space-y-4">
          {inProgressSession ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm font-medium">
                  Session {inProgressSession.session_number} in progress
                </span>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href={`/sessions/${inProgressSession.id}`}>Resume Session</Link>
              </Button>
            </>
          ) : completedCount < block.session_count ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ready to start Session {nextSessionNumber}
              </p>
              <form
                action={async () => {
                  'use server'
                  const sessionId = await createSession(block.id, nextSessionNumber)
                  redirect(`/sessions/${sessionId}`)
                }}
              >
                <Button type="submit" className="w-full" size="lg">
                  Start Session {nextSessionNumber}
                </Button>
              </form>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              All sessions complete!{' '}
              <Link href={`/history/${block.id}`} className="underline text-primary">
                View summary
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Last session targets */}
      {lastSessionDrills.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Last Session Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {lastSessionDrills.map((sd, i) => (
              <div key={sd.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm">{sd.drill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold">
                      {formatScoreWithUnit(sd.score, sd.drill.unit)}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {sd.drill.scoring_direction === 'higher_better' ? '↑ higher' : '↓ lower'}
                    </Badge>
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
