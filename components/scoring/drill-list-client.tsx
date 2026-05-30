'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TrainingBlock, BlockDrillItem } from '@/lib/types'
import { completeBlock, deleteBlock } from '@/lib/actions/blocks'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

interface BlockDrillListClientProps {
  block: TrainingBlock
  drills: BlockDrillItem[]
}

export function BlockDrillListClient({ block, drills }: BlockDrillListClientProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const upNext = drills.filter((d) => !d.done_today)
  const doneToday = drills.filter((d) => d.done_today)

  // completed_days is not available here — we'd need ActiveBlockInfo. Use a rough estimate from the
  // block data. The page can be updated to pass completed_days if needed. For now show 0/target_days.
  // The home screen has the accurate count; here we just show the block name and a drill list.

  async function handleComplete() {
    setCompleting(true)
    await completeBlock(block.id)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteBlock(block.id)
  }

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
        {/* Up Next */}
        {upNext.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Up Next
            </h2>
            <div className="space-y-2">
              {upNext.map((item) => (
                <DrillRow key={item.drill.id} item={item} blockId={block.id} />
              ))}
            </div>
          </section>
        )}

        {/* Done Today */}
        {doneToday.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Done Today
            </h2>
            <div className="space-y-2">
              {doneToday.map((item) => (
                <DrillRow key={item.drill.id} item={item} blockId={block.id} />
              ))}
            </div>
          </section>
        )}

        {drills.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No drills in this block.</p>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border px-4 py-4 flex gap-3">
        <Button
          onClick={handleComplete}
          disabled={completing || deleting}
          className="flex-1"
          size="lg"
        >
          {completing ? 'Completing…' : 'Mark Complete'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="lg" disabled={completing || deleting}>
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this block?</AlertDialogTitle>
              <AlertDialogDescription>
                All drill logs for &quot;{block.name}&quot; will be permanently deleted. This cannot be undone.
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
  )
}

function DrillRow({ item, blockId }: { item: BlockDrillItem; blockId: string }) {
  const { drill } = item
  const directionLabel = drill.scoring_direction === 'lower_better' ? '↓ lower' : '↑ higher'

  return (
    <Link
      href={`/blocks/${blockId}/drills/${drill.id}`}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 active:bg-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{drill.name}</p>
        <p className="text-sm text-muted-foreground">
          {drill.unit}
          {item.last_score !== null && ` · Last: ${item.last_score}`}
        </p>
      </div>
      <div className="ml-3 flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-xs">
          {directionLabel}
        </Badge>
        {item.done_today && (
          <Badge variant="default" className="text-xs">
            Done
          </Badge>
        )}
      </div>
    </Link>
  )
}
