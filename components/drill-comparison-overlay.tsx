'use client'

import type { DrillComparison } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface DrillComparisonOverlayProps {
  comparison: DrillComparison
  onDismiss: () => void
}

const trendConfig = {
  better: { icon: '↑', color: 'text-green-500', label: 'Improved' },
  worse:  { icon: '↓', color: 'text-red-500',   label: 'Declined' },
  same:   { icon: '→', color: 'text-yellow-500', label: 'Same' },
  first:  { icon: '★', color: 'text-blue-500',   label: 'First Entry' },
}

export function DrillComparisonOverlay({ comparison, onDismiss }: DrillComparisonOverlayProps) {
  const config = trendConfig[comparison.trend]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className={`text-5xl ${config.color}`}>{config.icon}</span>
        <p className={`text-xl font-semibold ${config.color}`}>{config.label}</p>

        <div className="mt-2">
          <p className="text-7xl font-bold tabular-nums">{comparison.current_score}</p>
          <p className="text-muted-foreground mt-1">{comparison.drill.unit}</p>
        </div>

        {comparison.trend !== 'first' && (
          <div className="flex gap-6 text-sm text-muted-foreground mt-4">
            {comparison.previous_score !== null && (
              <span>Previous: <strong>{comparison.previous_score}</strong></span>
            )}
            {comparison.personal_best !== null && (
              <span>Best: <strong>{comparison.personal_best}</strong></span>
            )}
          </div>
        )}

        {comparison.trend === 'first' && (
          <p className="text-sm text-muted-foreground mt-4">Nothing to compare yet — keep going!</p>
        )}
      </div>

      <div className="absolute bottom-8 w-full px-6">
        <Button onClick={onDismiss} className="w-full" size="lg">
          Back to Drills
        </Button>
      </div>
    </div>
  )
}
