import { cn } from '@/lib/utils'
import { bestIndex, marksFor } from '@/lib/scorecard'
import type { ScoringDirection, TrendDirection } from '@/lib/types'

interface ScorecardStripProps {
  /** Scores in the order they were logged */
  scores: number[]
  /** Number of boxes; defaults to scores.length. Boxes past the scores are empty sessions still to play */
  total?: number
  direction: ScoringDirection
  unit?: string
  /** Underline the next empty box in flag yellow */
  highlightNext?: boolean
  /** Index of a score whose mark should draw in (just saved) */
  animateIndex?: number
  /** Star the best score */
  showBest?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const MARK_WORD: Record<TrendDirection, string> = {
  better: 'better',
  worse: 'worse',
  same: 'same',
  first: 'first score',
}

/**
 * A row of scorecard boxes, one per session. Circle = better than the score before,
 * square = worse — the way golfers mark birdies and bogeys on a card.
 */
export function ScorecardStrip({
  scores,
  total,
  direction,
  unit,
  highlightNext = false,
  animateIndex,
  showBest = false,
  size = 'md',
  className,
}: ScorecardStripProps) {
  const count = Math.max(total ?? scores.length, scores.length)
  const marks = marksFor(scores, direction)
  const best = showBest && scores.length > 1 ? bestIndex(scores, direction) : -1

  return (
    <ol
      className={cn(
        'inline-grid overflow-hidden rounded-md border border-border bg-card',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, ${size === 'sm' ? '1.75rem' : size === 'lg' ? '3rem' : '2.5rem'}))` }}
      aria-label="Scorecard"
    >
      {Array.from({ length: count }, (_, i) => {
        const score = scores[i]
        const has = score !== undefined
        const mark = has ? marks[i] : null
        const isNext = highlightNext && i === scores.length
        const label = has
          ? `Session ${i + 1}: ${score}${unit ? ` ${unit}` : ''}, ${MARK_WORD[mark!]}${i === best ? ', best' : ''}`
          : `Session ${i + 1}: not played${isNext ? ', next' : ''}`
        return (
          <li
            key={i}
            aria-label={label}
            className={cn(
              'relative flex aspect-square items-center justify-center border-l border-border font-display font-bold tabular-nums first:border-l-0',
              size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-xs',
              has ? 'text-foreground' : 'bg-muted/50',
              isNext && 'bg-flag/15 shadow-[inset_0_-3px_0_hsl(var(--flag))]'
            )}
            style={{ fontStretch: '90%' }}
          >
            {has && <span className="relative z-[1] leading-none">{score}</span>}
            {has && (mark === 'better' || mark === 'worse') && (
              <Mark kind={mark} animate={animateIndex === i} />
            )}
            {i === best && (
              <span
                aria-hidden
                className="absolute right-0 top-0 z-[2] h-0 w-0 border-l-[7px] border-t-[7px] border-l-transparent border-t-flag"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Mark({ kind, animate }: { kind: 'better' | 'worse'; animate: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className="pointer-events-none absolute inset-0 h-full w-full">
      {kind === 'better' ? (
        <circle
          cx="20" cy="20" r="15.5"
          pathLength={1}
          className={cn('fill-none stroke-fairway', animate && 'animate-draw-mark')}
          strokeWidth="2"
          strokeDasharray="1"
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      ) : (
        <rect
          x="4.5" y="4.5" width="31" height="31" rx="1"
          pathLength={1}
          className={cn('fill-none stroke-stripe', animate && 'animate-draw-mark')}
          strokeWidth="2"
          strokeDasharray="1"
        />
      )}
    </svg>
  )
}
