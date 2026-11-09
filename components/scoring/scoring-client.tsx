'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TrainingBlock, BlockDrillItem, DrillComparison } from '@/lib/types'
import { saveDrillLog, skipDrillLog } from '@/lib/actions/drill-logs'
import { parseInstructions } from '@/lib/instructions'
import { ScoreInput } from '@/components/scoring/score-input'
import { BlockCompletionScreen } from '@/components/scoring/block-completion-screen'
import { ScorecardStrip } from '@/components/ui/scorecard-strip'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrillScoringClientProps {
  block: TrainingBlock
  drillItem: BlockDrillItem
  /** All drills in the block (Today's order), for "N of M" and the next drill */
  drills: BlockDrillItem[]
  blockId: string
}

export function DrillScoringClient({ block, drillItem, drills, blockId }: DrillScoringClientProps) {
  const router = useRouter()
  const { drill } = drillItem
  // Start at 0, not at min_score — min_score is a floor for validation, not a default.
  // (e.g. Safe Side Drill has min_score=-30 but should open at 0)
  const defaultScore = Math.max(0, drill.min_score ?? 0)
  const draftKey = `drill-draft-${blockId}-${drill.id}`
  // Completion is dismissed per-session so "Keep Going" doesn't re-trigger on every save
  const completionDismissKey = `block-complete-dismissed-${blockId}`

  const [score, setScore] = useState<number>(defaultScore)
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [result, setResult] = useState<DrillComparison | null>(null)
  const [showCompletionScreen, setShowCompletionScreen] = useState(false)

  const position = drills.findIndex((d) => d.drill.id === drill.id) + 1
  // Next = first drill still to do today, other than this one
  const nextDrill = drills.find((d) => d.drill.id !== drill.id && !d.done_today && !d.skipped_today) ?? null
  const scores = result ? [...drillItem.scores, result.current_score] : drillItem.scores

  // On mount: restore draft if drill wasn't scored today; clear stale draft if it was.
  useEffect(() => {
    if (drillItem.done_today) {
      localStorage.removeItem(draftKey)
      return
    }
    const saved = localStorage.getItem(draftKey)
    if (saved !== null) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed)) setScore(parsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist score to localStorage while actively scoring (not once saved).
  useEffect(() => {
    if (result !== null) return
    localStorage.setItem(draftKey, String(score))
  }, [draftKey, score, result])

  function clearDraft() {
    localStorage.removeItem(draftKey)
  }

  async function handleSave() {
    setSaving(true)
    clearDraft()
    const res = await saveDrillLog(blockId, drill.id, score)
    setResult(res.comparison)
    // Show completion screen only if: block just became complete AND user hasn't
    // dismissed it this session (via "Keep Going").
    if (res.blockComplete && !sessionStorage.getItem(completionDismissKey)) {
      setShowCompletionScreen(true)
    }
    setSaving(false)
  }

  async function handleSkip() {
    setSkipping(true)
    clearDraft()
    await skipDrillLog(blockId, drill.id)
    router.push(nextDrill ? `/blocks/${blockId}/drills/${nextDrill.drill.id}` : '/')
  }

  function handleKeepGoing() {
    // Suppress further completion prompts for this block this session
    sessionStorage.setItem(completionDismissKey, '1')
    setShowCompletionScreen(false)
  }

  if (showCompletionScreen) {
    return (
      <BlockCompletionScreen
        blockId={blockId}
        blockName={block.name}
        targetSessions={block.target_sessions}
        onKeepGoing={handleKeepGoing}
      />
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-height))] flex-col">
      {/* Header */}
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex h-11 items-center justify-between">
          <Link href="/" className="-ml-2 flex h-11 items-center gap-1.5 rounded-md px-2 font-bold text-muted-foreground active:bg-accent">
            <ArrowLeft className="h-5 w-5" />
            Today
          </Link>
          {position > 0 && (
            <span className="label">
              Drill {position} of {drills.length}
            </span>
          )}
        </div>
        <h1 className="screen-title mt-2 text-balance">{drill.name}</h1>
        <div className="mt-3 overflow-x-auto pb-1">
          <ScorecardStrip
            scores={scores}
            total={block.target_sessions}
            direction={drill.scoring_direction}
            unit={drill.unit}
            highlightNext={!result}
            animateIndex={result ? scores.length - 1 : undefined}
            showBest
          />
        </div>
      </header>

      {!result && (drill.description || drill.instructions) && (
        <HowToPlay description={drill.description} instructions={drill.instructions} defaultOpen={drillItem.session_count === 0} />
      )}

      {result ? (
        <Result result={result} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6">
          <ScoreInput drill={drill} value={score} onChange={setScore} />
          {drillItem.last_score !== null && (
            <p className="text-sm text-muted-foreground">
              Last time <span className="numeral text-foreground">{drillItem.last_score}</span>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1 px-4 pb-4 pt-2">
        {result ? (
          <>
            {nextDrill ? (
              <Button asChild size="lg" className="w-full justify-between">
                <Link href={`/blocks/${blockId}/drills/${nextDrill.drill.id}`}>
                  <span className="truncate">Next: {nextDrill.drill.name}</span>
                  <ArrowRight className="!size-5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/">All done today — back to Today</Link>
              </Button>
            )}
            {nextDrill && (
              <Button asChild variant="ghost" className="w-full text-muted-foreground">
                <Link href="/">Back to Today</Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={handleSave} disabled={saving || skipping} className="w-full" size="lg">
              {saving ? 'Saving…' : 'Save score'}
            </Button>
            <Button variant="ghost" onClick={handleSkip} disabled={saving || skipping} className="w-full text-muted-foreground">
              {skipping ? 'Skipping…' : 'Skip drill today'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function HowToPlay({ description, instructions, defaultOpen }: { description: string; instructions: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const blocks = useMemo(() => parseInstructions(instructions ?? ''), [instructions])

  return (
    <section className="mx-4 mt-4 rounded-lg border bg-card">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-bold">How to play</span>
          {!open && description && <span className="block truncate text-sm text-muted-foreground">{description}</span>}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="max-h-[38dvh] space-y-3 overflow-y-auto px-4 pb-4 text-[15px] leading-snug">
          {description && <p>{description}</p>}
          {blocks.map((b, i) =>
            b.type === 'steps' ? (
              <ol key={i} className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="numeral w-4 shrink-0 text-muted-foreground">{j + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p key={i} className="border-l-[3px] border-flag pl-3 text-muted-foreground">{b.text}</p>
            )
          )}
        </div>
      )}
    </section>
  )
}

const RESULT_COPY = {
  better: (prev: number | null) => `Better than last time (${prev})`,
  worse: (prev: number | null) => `Worse than last time (${prev})`,
  same: (prev: number | null) => `Same as last time (${prev})`,
  first: () => 'First score in this block',
}

export function Result({ result }: { result: DrillComparison }) {
  const { trend, current_score, previous_score, personal_best, drill } = result
  const isBest = personal_best !== null && personal_best === current_score && trend !== 'first'

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6 text-center" role="status">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <span className="numeral text-[88px] leading-none">{current_score}</span>
        {(trend === 'better' || trend === 'worse') && (
          <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            {trend === 'better' ? (
              <circle cx="50" cy="50" r="46" pathLength={1} strokeDasharray="1" transform="rotate(-90 50 50)"
                className="animate-draw-mark fill-none stroke-fairway" strokeWidth="3" strokeLinecap="round" />
            ) : (
              <rect x="6" y="6" width="88" height="88" rx="2" pathLength={1} strokeDasharray="1"
                className="animate-draw-mark fill-none stroke-stripe" strokeWidth="3" strokeLinecap="square" />
            )}
          </svg>
        )}
      </div>
      <p className="-mt-1 text-sm text-muted-foreground">{drill.unit}</p>
      <div>
        <p className={cn('text-lg font-bold', trend === 'better' && 'text-fairway', trend === 'worse' && 'text-stripe')}>
          {RESULT_COPY[trend](previous_score)}
        </p>
        {personal_best !== null && trend !== 'first' && (
          <p className="mt-1 text-sm text-muted-foreground">
            {isBest ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-flag px-2 py-0.5 font-bold text-flag-ink">Personal best</span>
            ) : (
              <>Personal best <span className="numeral text-foreground">{personal_best}</span></>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
