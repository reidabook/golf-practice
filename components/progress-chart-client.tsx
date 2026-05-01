'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { DrillProgress } from '@/lib/types'

const ProgressChart = dynamic(
  () => import('@/components/progress-chart').then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  }
)

export function ProgressChartClient({ progress }: { progress: DrillProgress }) {
  return <ProgressChart progress={progress} />
}
