export const dynamic = 'force-dynamic'

import { getProgressForAllDrills } from '@/lib/queries/progress'
import { getHandicapHistory } from '@/lib/queries/handicap'
import { syncHandicapToday } from '@/lib/utils/ghin-sync'
import { ProgressChartClient } from '@/components/progress-chart-client'
import { HandicapChartClient } from '@/components/handicap-chart-client'

export default async function ProgressPage() {
  const [syncResult, drillProgress, handicapHistory] = await Promise.all([
    syncHandicapToday(),
    getProgressForAllDrills(),
    getHandicapHistory(),
  ])

  const hasHandicapData = handicapHistory.length > 0
  const hasDrillData = drillProgress.length > 0

  if (!hasHandicapData && !hasDrillData) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-4xl mb-4">📈</p>
        <h2 className="text-xl font-semibold mb-2">No data yet</h2>
        <p className="text-muted-foreground text-sm">
          Log drills to see your progress charts here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {!syncResult.ok && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-400">
          Handicap sync failed — check Vercel logs for details.
          {syncResult.error && (
            <span className="block mt-1 text-xs text-amber-600">{syncResult.error}</span>
          )}
        </div>
      )}

      {hasHandicapData && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h2 className="font-semibold">Handicap Index</h2>
            <span className="text-2xl font-bold tabular-nums">
              {handicapHistory.at(-1)?.handicap_index.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">↓ lower is better</p>
          <HandicapChartClient snapshots={handicapHistory} />
        </div>
      )}

      {hasDrillData ? (
        drillProgress.map((dp) => (
          <div key={dp.drill.id} className="space-y-2">
            <div>
              <h2 className="font-semibold">{dp.drill.name}</h2>
              <p className="text-xs text-muted-foreground">
                {dp.drill.scoring_direction === 'higher_better' ? '↑ higher is better' : '↓ lower is better'}{' '}
                • {dp.drill.unit}
              </p>
            </div>
            <ProgressChartClient progress={dp} />
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Log drills to see your practice charts here.
          </p>
        </div>
      )}
    </div>
  )
}
