'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TrainingBlock, BlockDrillItem, DrillComparison } from '@/lib/types'
import { saveDrillLog, skipDrillLog } from '@/lib/actions/drill-logs'
import { ScoreInput } from '@/components/score-input'
import { DrillComparisonOverlay } from '@/components/drill-comparison-overlay'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface DrillScoringClientProps {
  block: TrainingBlock
  drillItem: BlockDrillItem
  blockId: string
}

export function DrillScoringClient({ block, drillItem, blockId }: DrillScoringClientProps) {
  const router = useRouter()
  const { drill } = drillItem
  const defaultScore = drill.min_score ?? 0

  const [score, setScore] = useState<number>(
    drillItem.last_score !== null ? drillItem.last_score : defaultScore
  )
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [comparison, setComparison] = useState<DrillComparison | null>(null)

  async function handleSave() {
    setSaving(true)
    const result = await saveDrillLog(blockId, drill.id, score)
    setComparison(result.comparison)
    setSaving(false)
  }

  async function handleSkip() {
    setSkipping(true)
    await skipDrillLog(blockId, drill.id)
    router.push(`/blocks/${blockId}/drills`)
  }

  function handleDismiss() {
    router.push(`/blocks/${blockId}/drills`)
  }

  if (comparison) {
    return <DrillComparisonOverlay comparison={comparison} onDismiss={handleDismiss} />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={() => router.push(`/blocks/${blockId}/drills`)}
          className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to drills"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{block.name}</p>
          <h1 className="text-xl font-bold leading-tight truncate">{drill.name}</h1>
        </div>
      </div>

      {/* Description / instructions */}
      {(drill.description || drill.instructions) && (
        <div className="px-4 pt-2 pb-4 space-y-1">
          {drill.description && (
            <p className="text-sm text-muted-foreground">{drill.description}</p>
          )}
          {drill.instructions && (
            <p className="text-sm text-muted-foreground">{drill.instructions}</p>
          )}
        </div>
      )}

      {/* Last score reference */}
      {drillItem.last_score !== null && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Last score:{' '}
            <span className="font-semibold text-foreground">{drillItem.last_score}</span>{' '}
            {drill.unit}
          </p>
        </div>
      )}

      {/* Score input — centered vertically in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <ScoreInput drill={drill} value={score} onChange={setScore} />
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-8 pt-4 space-y-3">
        <Button
          onClick={handleSave}
          disabled={saving || skipping}
          className="w-full"
          size="lg"
        >
          {saving ? 'Saving…' : 'Save Score'}
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={saving || skipping}
          className="w-full"
          size="lg"
        >
          {skipping ? 'Skipping…' : 'Skip Drill'}
        </Button>
      </div>
    </div>
  )
}
