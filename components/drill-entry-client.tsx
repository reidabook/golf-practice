'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveScore } from '@/lib/actions/session-drills'
import { skipDrill } from '@/lib/actions/session-drills'
import { completeSession } from '@/lib/actions/sessions'
import { ScoreInput } from '@/components/score-input'
import { DrillInstructions } from '@/components/drill-instructions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { SessionWithDrills, SessionDrill } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

interface DrillEntryClientProps {
  session: SessionWithDrills
  sessionDrill: SessionDrill
  orderedDrills: SessionDrill[]
  currentIndex: number
  pos: number
  total: number
  orderParam: string
}

export function DrillEntryClient({
  session,
  sessionDrill,
  orderedDrills,
  currentIndex,
  pos,
  total,
  orderParam,
}: DrillEntryClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCompletingSession, setIsCompletingSession] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const initialScore = sessionDrill.score !== null ? Number(sessionDrill.score) : sessionDrill.drill.min_score
  const [optimisticScore, setOptimisticScore] = useOptimistic(initialScore)
  const [localScore, setLocalScore] = useState(initialScore)

  const drill = sessionDrill.drill
  const isLast = currentIndex === orderedDrills.length - 1
  const progressPct = Math.round((pos / total) * 100)

  function buildDrillUrl(index: number) {
    const targetDrill = orderedDrills[index]
    return `/sessions/${session.id}/drill/${targetDrill.drill_id}?order=${orderParam}&pos=${index + 1}&total=${total}`
  }

  async function handleSave(goNext: boolean) {
    startTransition(async () => {
      setOptimisticScore(localScore)
      try {
        await saveScore(sessionDrill.id, localScore)
        if (goNext && !isLast) {
          router.push(buildDrillUrl(currentIndex + 1))
        }
      } catch {
        toast.error('Failed to save score')
      }
    })
  }

  async function handleFinish() {
    setIsCompletingSession(true)
    try {
      await saveScore(sessionDrill.id, localScore)
      await completeSession(session.id)
    } catch {
      toast.error('Failed to complete session')
      setIsCompletingSession(false)
    }
  }

  async function handleSkip() {
    setIsSkipping(true)
    try {
      await skipDrill(sessionDrill.id)
      if (isLast) {
        await completeSession(session.id)
      } else {
        router.push(buildDrillUrl(currentIndex + 1))
      }
    } catch {
      toast.error('Failed to skip drill')
      setIsSkipping(false)
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      // Save current score first, then navigate back
      startTransition(async () => {
        await saveScore(sessionDrill.id, localScore)
        router.push(buildDrillUrl(currentIndex - 1))
      })
    } else {
      router.push(`/sessions/${session.id}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={handleBack}
          disabled={isPending}
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">
              Drill {pos} of {total}
            </span>
            <Badge variant="outline" className="text-xs">
              {drill.scoring_direction === 'higher_better' ? '↑ higher' : '↓ lower'}
            </Badge>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </div>

      {/* Drill name */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold">{drill.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{drill.description}</p>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-4">
        <DrillInstructions instructions={drill.instructions} />
      </div>

      {/* Score input — centered, fills space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8">
        <ScoreInput
          drill={drill}
          value={localScore}
          onChange={(v) => {
            setLocalScore(v)
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-6 space-y-3">
        {isLast ? (
          <Button
            onClick={handleFinish}
            disabled={isCompletingSession || isPending || isSkipping}
            className="w-full"
            size="lg"
          >
            {isCompletingSession ? 'Saving...' : 'Save & Finish Session'}
          </Button>
        ) : (
          <Button
            onClick={() => handleSave(true)}
            disabled={isPending || isSkipping}
            className="w-full"
            size="lg"
          >
            {isPending ? 'Saving...' : 'Save & Next'}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isPending || isCompletingSession || isSkipping}
          className="w-full text-muted-foreground"
          size="sm"
        >
          {isSkipping ? 'Skipping...' : 'Skip Drill'}
        </Button>
      </div>
    </div>
  )
}
