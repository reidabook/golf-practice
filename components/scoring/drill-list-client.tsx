'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TrainingBlock, BlockDrillItem } from '@/lib/types'
import { completeBlock, deleteBlock, endBlockEarly } from '@/lib/actions/blocks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2 } from 'lucide-react'

interface BlockDrillListClientProps {
  block: TrainingBlock
  drills: BlockDrillItem[]
}

export function BlockDrillListClient({ block, drills }: BlockDrillListClientProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [endingEarly, setEndingEarly] = useState(false)

  const upNext = drills.filter((d) => !d.done_today)
  const doneToday = drills.filter((d) => d.done_today)

  async function handleComplete() {
    setCompleting(true)
    await completeBlock(block.id)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteBlock(block.id)
  }

  async function handleEndEarly() {
    setEndingEarly(true)
    await endBlockEarly(block.id)
  }

  const busy = completing || deleting || endingEarly

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">{block.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {drills.length} drill{drills.length !== 1 ? 's' : ''}
          {doneToday.length > 0 && ` · ${doneToday.length} done today`}
        </p>
      </div>

      {/* Drill sections */}
      <div className="flex-1 px-4 space-y-6">
        {upNext.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Up Next
            </h2>
            <div className="space-y-2">
              {upNext.map((item) => (
                <DrillRow key={item.drill.id} item={item} blockId={block.id} targetSessions={block.target_sessions} />
              ))}
            </div>
          </section>
        )}

        {doneToday.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Done Today
            </h2>
            <div className="space-y-2">
              {doneToday.map((item) => (
                <DrillRow key={item.drill.id} item={item} blockId={block.id} targetSessions={block.target_sessions} />
              ))}
            </div>
          </section>
        )}

        {drills.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No drills in this block.</p>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border px-4 py-4 space-y-2">
        <div className="flex gap-3">
          <Button
            onClick={handleComplete}
            disabled={busy}
            className="flex-1"
            size="lg"
          >
            {completing ? 'Completing…' : 'Mark Complete'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" disabled={busy}>
                End Early
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End this block early?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{block.name}&rdquo; will be marked as ended early and removed from active training. Your drill logs are kept.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndEarly}>
                  {endingEarly ? 'Ending…' : 'End Early'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" disabled={busy} className="text-destructive border-destructive/40 hover:bg-destructive/10">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  All drill logs for &ldquo;{block.name}&rdquo; will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting…' : 'Delete Block'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

function DrillRow({
  item,
  blockId,
  targetSessions,
}: {
  item: BlockDrillItem
  blockId: string
  targetSessions: number
}) {
  const { drill } = item
  const isBlockComplete = item.session_count >= targetSessions
  const directionLabel = drill.scoring_direction === 'lower_better' ? '↓ lower' : '↑ higher'

  return (
    <Link
      href={`/blocks/${blockId}/drills/${drill.id}`}
      className={`flex items-center justify-between rounded-lg border bg-card px-4 py-3 active:bg-accent transition-colors ${
        isBlockComplete ? 'border-green-500/30 opacity-70' : 'border-border'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isBlockComplete && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
          <p className="font-medium truncate">{drill.name}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {drill.unit}
          {item.last_score !== null && ` · Last: ${item.last_score}`}
          {' · '}
          <span className={isBlockComplete ? 'text-green-600' : ''}>
            {item.session_count}/{targetSessions} sessions
          </span>
        </p>
      </div>
      <div className="ml-3 flex items-center gap-2 shrink-0">
        {isBlockComplete ? (
          <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
            Complete
          </Badge>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs">
              {directionLabel}
            </Badge>
            {item.done_today && (
              <Badge variant="outline" className="text-xs">
                Today
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  )
}
