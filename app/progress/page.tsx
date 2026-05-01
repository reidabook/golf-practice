import { getProgressForAllDrills } from '@/lib/queries/progress'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const ProgressChart = dynamic(
  () => import('@/components/progress-chart').then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  }
)

export default async function ProgressPage() {
  const drillProgress = await getProgressForAllDrills()

  if (drillProgress.length === 0) {
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

      {drillProgress.map((dp) => (
        <div key={dp.drill.id} className="space-y-2">
          <div>
            <h2 className="font-semibold">{dp.drill.name}</h2>
            <p className="text-xs text-muted-foreground">
              {dp.drill.scoring_direction === 'higher_better' ? '↑ higher is better' : '↓ lower is better'}{' '}
              • {dp.drill.unit}
            </p>
          </div>
          <ProgressChart progress={dp} />
        </div>
      ))}
    </div>
  )
}
