'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { BlockDrillItem, TrainingBlock } from '@/lib/types'
import { completeBlock, deleteBlock, endBlockEarly } from '@/lib/actions/blocks'
import { PageHeader, SectionLabel } from '@/components/ui/page'
import { ScorecardStrip } from '@/components/ui/scorecard-strip'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HomeRoutine } from '@/components/today/home-routine'
import { ArrowRight, Check, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodayClientProps {
  block: TrainingBlock
  drills: BlockDrillItem[]
  dateLabel: string
}

export function TodayClient({ block, drills, dateLabel }: TodayClientProps) {
  const upNext = drills.filter((d) => !d.done_today)
  const doneToday = drills.filter((d) => d.done_today)
  const next = upNext[0] ?? null
  const minSessions = drills.length ? Math.min(...drills.map((d) => d.session_count)) : 0
  // Today's session = the one the least-played drill is on
  const sessionNumber = Math.max(1, Math.min(upNext.length > 0 ? minSessions + 1 : minSessions, block.target_sessions))

  return (
    <div className={cn(next && 'pb-24')}>
      <PageHeader
        eyebrow={dateLabel}
        title={block.name}
        subtitle={
          <>
            Session {sessionNumber} of {block.target_sessions} · {doneToday.length} of {drills.length} done today
          </>
        }
        action={<BlockMenu block={block} />}
      />

      <div className="space-y-7 px-4">
        {drills.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            This block has no drills. Add some to its template in Library → Blocks.
          </p>
        )}

        {upNext.length > 0 && (
          <section>
            <SectionLabel trailing={`${upNext.length} to go`}>Up next</SectionLabel>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {upNext.map((item) => (
                <DrillRow key={item.drill.id} item={item} block={block} isNext={item === next} />
              ))}
            </div>
          </section>
        )}

        {upNext.length === 0 && drills.length > 0 && (
          <div className="rounded-lg border border-fairway/30 bg-fairway/[0.07] px-4 py-4">
            <p className="font-bold">All {drills.length} drills scored today</p>
            <p className="text-sm text-muted-foreground">Tap any drill to score it again. Extra scores show in Progress.</p>
          </div>
        )}

        {doneToday.length > 0 && (
          <section>
            <SectionLabel>Done today</SectionLabel>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {doneToday.map((item) => (
                <DoneRow key={item.drill.id} item={item} blockId={block.id} />
              ))}
            </div>
          </section>
        )}

        <HomeRoutine />
      </div>

      {next && (
        <div className="fixed inset-x-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-3 pt-6" style={{ bottom: 'var(--nav-height)' }}>
          <div className="mx-auto max-w-lg">
            <Button asChild size="lg" className="w-full justify-between">
              <Link href={`/blocks/${block.id}/drills/${next.drill.id}`}>
                <span className="truncate">Start: {next.drill.name}</span>
                <ArrowRight className="!size-5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DirectionHint({ item }: { item: BlockDrillItem }) {
  return (
    <span className="label shrink-0 normal-case tracking-normal">
      {item.drill.unit} {item.drill.scoring_direction === 'lower_better' ? '↓' : '↑'}
    </span>
  )
}

function DrillRow({ item, block, isNext }: { item: BlockDrillItem; block: TrainingBlock; isNext: boolean }) {
  const { drill } = item
  const finished = item.session_count >= block.target_sessions
  return (
    <Link
      href={`/blocks/${block.id}/drills/${drill.id}`}
      className={cn('relative block px-4 py-3.5 transition-colors active:bg-accent', isNext && 'bg-flag/[0.06]')}
    >
      {isNext && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-flag" />}
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[17px] font-bold">
          {drill.name}
          {finished && <span className="label ml-2 align-middle text-fairway">Target met</span>}
        </p>
        <DirectionHint item={item} />
      </div>
      <ScorecardStrip
        scores={item.scores}
        total={block.target_sessions}
        direction={drill.scoring_direction}
        unit={drill.unit}
        highlightNext={isNext}
        showBest
      />
    </Link>
  )
}

function DoneRow({ item, blockId }: { item: BlockDrillItem; blockId: string }) {
  return (
    <Link href={`/blocks/${blockId}/drills/${item.drill.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fairway text-primary-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1 truncate font-bold text-muted-foreground">{item.drill.name}</span>
      {item.today_score !== null && (
        <span className="numeral text-lg">
          {item.today_score}
          <span className="ml-1 font-sans text-xs font-normal text-muted-foreground" style={{ fontStretch: '100%' }}>{item.drill.unit}</span>
        </span>
      )}
    </Link>
  )
}

type Pending = null | 'complete' | 'end' | 'delete'

function BlockMenu({ block }: { block: TrainingBlock }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<Pending>(null)
  const [busy, startTransition] = useTransition()

  function run(action: Exclude<Pending, null>) {
    startTransition(async () => {
      if (action === 'complete') await completeBlock(block.id)
      if (action === 'end') await endBlockEarly(block.id)
      if (action === 'delete') await deleteBlock(block.id)
    })
  }

  const copy = {
    complete: {
      title: `Mark ${block.name} complete?`,
      body: 'It moves to Progress as done. Your scores are kept.',
      action: 'Mark complete',
    },
    end: {
      title: `End ${block.name} early?`,
      body: 'It moves to Progress as ended early. Your scores are kept.',
      action: 'End early',
    },
    delete: {
      title: `Delete ${block.name}?`,
      body: "Every score logged in this block is deleted too. This can't be undone.",
      action: 'Delete block',
    },
  } as const

  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Block options" onClick={() => setOpen(true)} className="-mr-2 text-muted-foreground">
        <MoreHorizontal className="!size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end bg-ink/40" onClick={() => setOpen(false)}>
          <div
            role="menu"
            className="mx-auto w-full max-w-lg rounded-t-2xl border-t bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <p className="label mb-2 px-1">{block.name}</p>
            <div className="divide-y overflow-hidden rounded-lg border">
              <MenuItem onClick={() => { setOpen(false); setConfirm('complete') }}>Mark complete</MenuItem>
              <MenuItem onClick={() => { setOpen(false); setConfirm('end') }}>End early</MenuItem>
              <MenuItem destructive onClick={() => { setOpen(false); setConfirm('delete') }}>Delete block</MenuItem>
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{copy[confirm].title}</AlertDialogTitle>
              <AlertDialogDescription>{copy[confirm].body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(e) => { e.preventDefault(); run(confirm) }}
                className={cn(confirm === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              >
                {busy ? 'Working…' : copy[confirm].action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}

function MenuItem({ children, onClick, destructive }: { children: React.ReactNode; onClick: () => void; destructive?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={cn('flex h-12 w-full items-center px-4 text-left font-bold active:bg-accent', destructive && 'text-stripe')}>
      {children}
    </button>
  )
}
